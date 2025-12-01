import { db } from "@/lib/db";
import { formatReleaseDate } from "@/utils/spotify";

export async function saveSongToDatabase(trackData: any, featuresData: any) {
	const client = await db.connect();

	try {
		await client.query("BEGIN");

		let albumId;
		const albumName = trackData.album.name;
		const releaseDate = formatReleaseDate(trackData.album.release_date);

		const checkAlbum = await client.query("SELECT album_id FROM Album WHERE name = $1", [albumName]);

		if (checkAlbum.rows.length > 0) {
			albumId = checkAlbum.rows[0].album_id;
		} else {
			const insertAlbum = await client.query(
				"INSERT INTO Album (name, release_date) VALUES ($1, $2) RETURNING album_id",
				[albumName, releaseDate],
			);
			albumId = insertAlbum.rows[0].album_id;
		}

		const insertTrack = await client.query(
			"INSERT INTO Track (name, duration, album_id) VALUES ($1, $2, $3) RETURNING track_id",
			[trackData.name, trackData.duration_ms, albumId],
		);
		const newTrackId = insertTrack.rows[0].track_id;

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

			await client.query("INSERT INTO TrackArtists (track_id, artist_id) VALUES ($1, $2)", [
				newTrackId,
				artistId,
			]);
		}

		await client.query(
			`INSERT INTO AudioFeatures 
      (track_id, danceability, energy, valence, loudness) 
      VALUES ($1, $2, $3, $4, $5)`,
			[
				newTrackId,
				featuresData.danceability ?? 0.0,
				featuresData.energy ?? 0.0,
				featuresData.valence ?? 0.0,
				featuresData.loudness ?? 0.0,
			],
		);

		await client.query("COMMIT");

		return {
			track_id: newTrackId,
			track_name: trackData.name,
			album: albumName,
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
		const query = 
	  `SELECT t.track_id as id, t.name as track_name, al.name as album, STRING_AGG(ar.name, ', ') as artist, af.danceability, af.energy, af.valence, af.loudness
      FROM Track t
      JOIN Album al ON t.album_id = al.album_id
      LEFT JOIN AudioFeatures af ON t.track_id = af.track_id
      LEFT JOIN TrackArtists ta ON t.track_id = ta.track_id
      LEFT JOIN Artist ar ON ta.artist_id = ar.artist_id
      GROUP BY t.track_id, t.name, al.name, af.danceability, af.energy, af.valence, af.loudness
      ORDER BY t.track_id DESC;
    `;
		const result = await client.query(query);

		// result to match our SongData type
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
