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
		
		const checkTrack = await client.query("SELECT track_id FROM Track WHERE name = $1 AND album_id = $2", [trackData.name, albumId]);

		if(checkTrack.rows.length > 0) {
			throw new Error(`Track '${trackData.name}' in album '${albumName}' already exists.`)
		}

		const checkTrack = await client.query(
			"SELECT track_id FROM Track WHERE name = $1 AND album_id = $2",
			[trackData.name, albumId],
		);

		let trackId;
		let isUpdate = false;

		if (checkTrack.rows.length > 0) {
			trackId = checkTrack.rows[0].track_id;
			isUpdate = true;
			await client.query(
				"UPDATE Track SET duration = $1 WHERE track_id = $2",
				[trackData.duration_ms, trackId],
			);
		} else {
			const insertTrack = await client.query(
				"INSERT INTO Track (name, duration, album_id) VALUES ($1, $2, $3) RETURNING track_id",
				[trackData.name, trackData.duration_ms, albumId],
			);
			trackId = insertTrack.rows[0].track_id;
		}

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

		const checkFeatures = await client.query(
			"SELECT track_id FROM AudioFeatures WHERE track_id = $1",
			[trackId],
		);

		if (checkFeatures.rows.length > 0) {
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
        Track.track_id, 
        Track.name, 
        Album.name AS album_name, 
        AudioFeatures.danceability, 
        AudioFeatures.energy, 
        AudioFeatures.valence, 
        AudioFeatures.loudness,
        STRING_AGG(Artist.name, ', ') AS artist_names
      FROM Track
      JOIN Album ON Track.album_id = Album.album_id
      LEFT JOIN AudioFeatures ON Track.track_id = AudioFeatures.track_id
      LEFT JOIN TrackArtists ON Track.track_id = TrackArtists.track_id
      LEFT JOIN Artist ON TrackArtists.artist_id = Artist.artist_id
      GROUP BY Track.track_id, Track.name, Album.name, AudioFeatures.danceability, AudioFeatures.energy, AudioFeatures.valence, AudioFeatures.loudness
      ORDER BY Track.track_id DESC
    `;

		const result = await client.query(query);
		return result.rows.map(row => {
			return {
				id: row.track_id,
				track_name: row.name,
				artist: row.artist_names,
				album: row.album_name,
				audioFeatures: {
					danceability: row.danceability || 0,
					energy: row.energy || 0,
					valence: row.valence || 0,
					loudness: row.loudness || 0,
				},
			};
		});
	} finally {
		client.release();
	}
}

export async function deleteSong(trackId: number) {
	const client = await db.connect();
	try {
		await client.query("DELETE FROM Track WHERE track_id = $1", [trackId]);
		return {
			success: true,
		};
	} finally {
		client.release();
	}
}

export async function getAnalytics() {
	const client = await db.connect();

	try {
		const artistQuery = `
      SELECT 
        Artist.name, 
        COUNT(Track.track_id) as track_count,
        AVG(AudioFeatures.energy) as avg_energy,
        AVG(AudioFeatures.danceability) as avg_danceability
      FROM Artist
      JOIN TrackArtists ON Artist.artist_id = TrackArtists.artist_id
      JOIN Track ON TrackArtists.track_id = Track.track_id
      JOIN AudioFeatures ON Track.track_id = AudioFeatures.track_id
      GROUP BY Artist.artist_id, Artist.name
      ORDER BY avg_energy DESC
      LIMIT 5
    `;

		const albumQuery = `
      SELECT 
        Album.name,
        COUNT(Track.track_id) as track_count,
        SUM(Track.duration) / 60000.0 as total_duration_minutes
      FROM Album
      JOIN Track ON Album.album_id = Track.album_id
      GROUP BY Album.album_id, Album.name
      ORDER BY total_duration_minutes DESC
      LIMIT 5
    `;

		const artistResults = await client.query(artistQuery);
		const albumResults = await client.query(albumQuery);

		return {
			topArtists: artistResults.rows,
			longestAlbums: albumResults.rows,
		};
	} finally {
		client.release();
	}
}
