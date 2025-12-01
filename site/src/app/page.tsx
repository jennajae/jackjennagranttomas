"use client";

import { useState, useEffect } from "react";
import type { SongData } from "@/utils/types";

export default function Home() {
	const [url, setUrl] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [songs, setSongs] = useState<SongData[]>([]);
	const [selectedSong, setSelectedSong] = useState<SongData | null>(null);

	useEffect(() => {
		fetchSongs();
	}, []);

	const fetchSongs = async () => {
		try {
			const res = await fetch("/api/songs");
			const data = await res.json();
			if (data.success) {
				setSongs(data.data);
				if (data.data.length > 0 && !selectedSong) {
					setSelectedSong(data.data[0]);
				}
			}
		} catch (err) {
			console.error("Failed to fetch library", err);
		}
	};

	const handleAnalyze = async () => {
		if (!url) return;
		setLoading(true);
		setError(null);

		try {
			const res = await fetch("/api/add-song", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ spotifyUrl: url }),
			});

			const result = await res.json();

			if (!res.ok) {
				throw new Error(result.error || "Failed to add song");
			}

			setUrl("");
			await fetchSongs();

			const newRes = await fetch("/api/songs");
			const newData = await newRes.json();
			if (newData.data && newData.data.length > 0) {
				setSelectedSong(newData.data[0]);
			}
		} catch (err: any) {
			setError(err.message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen w-full bg-neutral-950 flex flex-col items-center p-4 text-white font-sans">
			{/* Header */}
			<div className="text-center mt-12 mb-10">
				<h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text mb-2">
					Groovee
				</h1>
				<p className="text-neutral-400">Spotify Audio Analyzer</p>
			</div>

			<div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
				{/* LEFT COLUMN: Input & Library */}
				<div className="flex flex-col gap-6">
					{/* Input Box */}
					<div className="bg-neutral-900/50 p-6 rounded-2xl border border-neutral-800">
						<h3 className="text-lg font-semibold mb-4 text-white">Import Song</h3>
						<div className="flex flex-col gap-3">
							<input
								type="text"
								placeholder="Spotify URL..."
								value={url}
								onChange={e => setUrl(e.target.value)}
								className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-green-500 outline-none text-sm"
							/>
							<button
								onClick={handleAnalyze}
								disabled={loading || !url}
								className="w-full py-3 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-50 font-medium transition-colors text-sm"
							>
								{loading ? "Processing..." : "Add to Library"}
							</button>
							{error && <p className="text-red-400 text-xs mt-2">{error}</p>}
						</div>
					</div>

					{/* Library List */}
					<div className="bg-neutral-900/50 rounded-2xl border border-neutral-800 flex-1 overflow-hidden flex flex-col h-[500px]">
						<div className="p-4 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm">
							<h3 className="text-lg font-semibold">Your Library</h3>
						</div>
						<div className="overflow-y-auto flex-1 p-2 space-y-2">
							{songs.map(song => (
								<div
									key={song.id}
									onClick={() => setSelectedSong(song)}
									className={`p-3 rounded-lg cursor-pointer transition-all border ${
										selectedSong?.id === song.id
											? "bg-neutral-800 border-green-500/50"
											: "hover:bg-neutral-800 border-transparent"
									}`}
								>
									<div className="font-medium text-sm truncate">
										{song.track_name}
									</div>
									<div className="text-xs text-neutral-400 truncate">
										{song.artist} • {song.album}
									</div>
								</div>
							))}
							{songs.length === 0 && (
								<div className="text-center text-neutral-500 text-sm mt-10">
									No songs imported yet.
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="lg:col-span-2">
					{selectedSong ? (
						<div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 h-full flex flex-col animate-in fade-in duration-500">
							<div className="mb-8">
								<h2 className="text-4xl font-bold text-white mb-2">
									{selectedSong.track_name}
								</h2>
								<div className="flex items-center gap-2 text-neutral-400 text-lg">
									<span className="text-green-400 font-medium">
										{selectedSong.artist}
									</span>
									<span>•</span>
									<span>{selectedSong.album}</span>
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<FeatureCard
									label="Danceability"
									value={selectedSong.audioFeatures.danceability}
									color="bg-pink-500"
									description="How suitable a track is for dancing."
								/>
								<FeatureCard
									label="Energy"
									value={selectedSong.audioFeatures.energy}
									color="bg-yellow-500"
									description="Perceptual measure of intensity and activity."
								/>
								<FeatureCard
									label="Valence (Mood)"
									value={selectedSong.audioFeatures.valence}
									color="bg-purple-500"
									description="Musical positiveness (Happy vs. Sad)."
								/>
								<FeatureCard
									label="Loudness"
									value={
										(selectedSong.audioFeatures.loudness +
											60) /
										60
									}
									displayValue={`${selectedSong.audioFeatures.loudness.toFixed(1)} dB`}
									color="bg-cyan-500"
									description="Overall loudness of a track in decibels."
								/>
							</div>
						</div>
					) : (
						<div className="h-full flex flex-col items-center justify-center text-neutral-500 border border-neutral-800 border-dashed rounded-3xl bg-neutral-900/30">
							<p>Select a song from the library to visualize</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function FeatureCard({
	label,
	value,
	color,
	displayValue,
	description,
}: {
	label: string;
	value: number;
	color: string;
	displayValue?: string;
	description?: string;
}) {
	const clampedValue = Math.min(Math.max(value, 0), 1);
	const percentage = Math.round(clampedValue * 100);

	return (
		<div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl flex flex-col gap-4 shadow-sm">
			<div className="flex justify-between items-start">
				<div>
					<span className="text-white font-semibold text-lg block">{label}</span>
					<span className="text-neutral-500 text-xs block mt-1">{description}</span>
				</div>
				<span className="text-white font-mono text-xl font-bold">
					{displayValue || `${percentage}%`}
				</span>
			</div>

			<div className="w-full h-4 bg-neutral-900 rounded-full overflow-hidden border border-neutral-800">
				<div
					className={`h-full ${color} transition-all duration-1000 ease-out`}
					style={{ width: `${percentage}%` }}
				/>
			</div>
		</div>
	);
}
