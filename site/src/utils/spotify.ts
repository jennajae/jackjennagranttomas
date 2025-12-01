export function extractTrackId(url: string): string | null {
	const match = url.match(/track\/([a-zA-Z0-9]+)/);
	return match ? match[1] : null;
}

export function formatReleaseDate(dateString: string): string {
	if (dateString.length === 4) return `${dateString}-01-01`;
	if (dateString.length === 7) return `${dateString}-01`;
	return dateString;
}

export async function getSpotifyAccessToken() {
	const clientId = process.env.SPOTIFY_CLIENT_ID;
	const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

	if (!clientId || !clientSecret) {
		throw new Error("missing clientid/secret");
	}

	const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Authorization": `Basic ${basicAuth}`,
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			grant_type: "client_credentials",
		}),
		cache: "no-store",
	});

	if (!response.ok) {
		throw new Error("failed to fetch spotify token");
	}

	const data = await response.json();
	return data.access_token;
}
