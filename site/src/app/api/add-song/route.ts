import { NextResponse } from "next/server";
import { getSpotifyAccessToken, extractTrackId } from "@/utils/spotify";
import { saveSongToDatabase } from "@/utils/db";
import { fetchReccoBeatsFeatures } from "@/utils/reccobeats";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { spotifyUrl } = body;

		if (!spotifyUrl) {
			return NextResponse.json({ error: "spotify url is required" }, { status: 400 });
		}

		const trackId = extractTrackId(spotifyUrl);
		if (!trackId) {
			return NextResponse.json({ error: "invalid spotify url" }, { status: 400 });
		}

		const accessToken = await getSpotifyAccessToken();

		const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
			headers: { Authorization: `Bearer ${accessToken}` },
			cache: "no-store",
		});

		if (!trackResponse.ok) {
			return NextResponse.json(
				{ error: "failed to fetch song data from Spotify" },
				{ status: trackResponse.status },
			);
		}

		const trackData = await trackResponse.json();

		// sspotify apparently depreciated the audio features so we gotta use an alternative, if that fails then we will mock data lol
		let featuresData: any = {};
		const reccoFeatures = await fetchReccoBeatsFeatures(trackId);
		if (reccoFeatures) {
			featuresData = reccoFeatures;
		} else {
			console.log("reccobeats failed using mock data");
			featuresData = {
				danceability: Number((Math.random() * 0.5 + 0.4).toFixed(3)),
				energy: Number((Math.random() * 0.5 + 0.4).toFixed(3)),
				valence: Number((Math.random() * 0.8 + 0.1).toFixed(3)),
				loudness: Number((-Math.random() * 10 - 4).toFixed(3)),
			};
		}

		const savedData = await saveSongToDatabase(trackData, featuresData);

		return NextResponse.json({
			success: true,
			message: "Song saved to database successfully",
			data: savedData,
		});
	} catch (error: any) {
		console.error("api error:", error);
		return NextResponse.json({ error: error.message || "internal error" }, { status: 500 });
	}
}
