export async function fetchReccoBeatsFeatures(spotifyTrackId: string) {
	try {
		const searchRes = await fetch(`https://api.reccobeats.com/v1/track?ids=${spotifyTrackId}`, {
			cache: "no-store",
		});

		if (!searchRes.ok) return null;

		const searchData = await searchRes.json();
		// console.log(searchData);

		const reccoId = searchData.content?.[0]?.id;

		if (!reccoId) return null;

		const featuresRes = await fetch(`https://api.reccobeats.com/v1/track/${reccoId}/audio-features`, {
			cache: "no-store",
		});

		if (!featuresRes.ok) return null;

		const features = await featuresRes.json();
		// console.log(features);

		return {
			danceability: features.danceability,
			energy: features.energy,
			valence: features.valence,
			loudness: features.loudness,
		};
	} catch (error) {
		console.warn("ReccoBeats fetch failed:", error);
		return null;
	}
}
