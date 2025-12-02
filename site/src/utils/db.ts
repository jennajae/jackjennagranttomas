import { db } from "@/lib/db";
import { formatReleaseDate } from "@/utils/spotify";

export async function saveSongToDatabase(trackData: any, featuresData: any) {
	const client = await db.connect();

	try {
		await client.query("BEGIN");

		let albumId;
		const albumName = trackData.album.name;
		const releaseDate = formatReleaseDate(trackData.album.release_date);

		// Check if album exists
		const checkAlbum = await client.query("SELECT album_id FROM Album WHERE name = $1", [albumName]);

		if (checkAlbum.rows.length > 0) {
			albumId = checkAlbum.rows[0].album_id;
			// UPDATE: Update album release date if it changed
			await client.query(
				"UPDATE Album SET release_date = $1 WHERE album_id = $2",
				[releaseDate, albumId],
			);
		} else {
			const insertAlbum = await client.query(
				"INSERT INTO Album (name, release_date) VALUES ($1, $2) RETURNING album_id",
				[albumName, releaseDate],
			);
			albumId = insertAlbum.rows[0].album_id;
		}

		// Check if track already exists (by name and album)
		const checkTrack = await client.query(
			"SELECT track_id FROM Track WHERE name = $1 AND album_id = $2",
			[trackData.name, albumId],
		);

		let trackId;
		let isUpdate = false;

		if (checkTrack.rows.length > 0) {
			// UPDATE: Track exists, update its duration
			trackId = checkTrack.rows[0].track_id;
			isUpdate = true;
			await client.query(
				"UPDATE Track SET duration = $1 WHERE track_id = $2",
				[trackData.duration_ms, trackId],
			);
		} else {
			// INSERT: Track doesn't exist, insert new
			const insertTrack = await client.query(
				"INSERT INTO Track (name, duration, album_id) VALUES ($1, $2, $3) RETURNING track_id",
				[trackData.name, trackData.duration_ms, albumId],
			);
			trackId = insertTrack.rows[0].track_id;
		}

		// Handle artists
		for (const artist of trackData.artists) {
			let artistId;
			const artistName = artist.name;

			const checkArtist = await client.query("SELECT artist_id FROM Artist WHERE name = $1", [
				artistName,
			]);

			if (checkArtist.rows.length > 0) {
				artistId = checkArtist.rows[0].artist_id;
			} else {
				const insertArtist = await client.query(
					"INSERT INTO Artist (name) VALUES ($1) RETURNING artist_id",
					[artistName],
				);
				artistId = insertArtist.rows[0].artist_id;
			}

			// Only insert track-artist relationship if it doesn't exist
			const checkTrackArtist = await client.query(
				"SELECT 1 FROM TrackArtists WHERE track_id = $1 AND artist_id = $2",
				[trackId, artistId],
			);
			if (checkTrackArtist.rows.length === 0) {
				await client.query("INSERT INTO TrackArtists (track_id, artist_id) VALUES ($1, $2)", [
					trackId,
					artistId,
				]);
			}
		}

		// Check if audio features exist for this track
		const checkFeatures = await client.query(
			"SELECT track_id FROM AudioFeatures WHERE track_id = $1",
			[trackId],
		);

		if (checkFeatures.rows.length > 0) {
			// UPDATE: Audio features exist, update them
			await client.query(
				`UPDATE AudioFeatures 
				SET danceability = $1, energy = $2, valence = $3, loudness = $4
				WHERE track_id = $5`,
				[
					featuresData.danceability ?? 0.0,
					featuresData.energy ?? 0.0,
					featuresData.valence ?? 0.0,
					featuresData.loudness ?? 0.0,
					trackId,
				],
			);
		} else {
			// INSERT: Audio features don't exist, insert new
			await client.query(
				`INSERT INTO AudioFeatures 
				(track_id, danceability, energy, valence, loudness) 
				VALUES ($1, $2, $3, $4, $5)`,
				[
					trackId,
					featuresData.danceability ?? 0.0,
					featuresData.energy ?? 0.0,
					featuresData.valence ?? 0.0,
					featuresData.loudness ?? 0.0,
				],
			);
		}

		await client.query("COMMIT");

		return {
			track_id: trackId,
			track_name: trackData.name,
			album: albumName,
			updated: isUpdate,
		};
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
}

export async function getAllSongs() {
	const client = await db.connect();
	try {
		const query = `
      SELECT 
        t.track_id as id,
        t.name as track_name,
        al.name as album,
        STRING_AGG(ar.name, ', ') as artist,
        af.danceability, 
        af.energy, 
        af.valence, 
        af.loudness
      FROM Track t
      JOIN Album al ON t.album_id = al.album_id
      LEFT JOIN AudioFeatures af ON t.track_id = af.track_id
      LEFT JOIN TrackArtists ta ON t.track_id = ta.track_id
      LEFT JOIN Artist ar ON ta.artist_id = ar.artist_id
      GROUP BY t.track_id, t.name, al.name, af.danceability, af.energy, af.valence, af.loudness
      ORDER BY t.track_id DESC;
    `;
		const result = await client.query(query);

		// Format the results to match our SongData type
		return result.rows.map(row => ({
			id: row.id,
			track_name: row.track_name,
			artist: row.artist,
			album: row.album,
			audioFeatures: {
				danceability: row.danceability ?? 0,
				energy: row.energy ?? 0,
				valence: row.valence ?? 0,
				loudness: row.loudness ?? 0,
			},
		}));
	} finally {
		client.release();
	}
}

export async function deleteSong(trackId: number) {
	const client = await db.connect();
	try {
		await client.query("DELETE FROM Track WHERE track_id = $1", [trackId]);
		return { success: true };
	} finally {
		client.release();
	}
}
