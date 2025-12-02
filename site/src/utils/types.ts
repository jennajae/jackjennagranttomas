export type SongData = {
	id: number;
	track_name: string;
	artist: string;
	album: string;
	audioFeatures: {
		danceability: number;
		energy: number;
		valence: number;
		loudness: number;
	};
};

export type ArtistAnalytics = {
	name: string;
	track_count: string;
	avg_energy: number;
	avg_danceability: number;
};

export type AlbumAnalytics = {
	name: string;
	track_count: string;
	total_duration_minutes: number;
};
