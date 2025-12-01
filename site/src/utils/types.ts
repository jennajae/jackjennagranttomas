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
