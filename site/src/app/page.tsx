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

	const handleDelete = async (e: React.MouseEvent, id: number) => {
		e.stopPropagation();

		if (!confirm("Are you sure you want to delete this song?")) return;

		try {
			const res = await fetch(`/api/songs/${id}`, {
				method: "DELETE",
			});

			if (res.ok) {
				if (selectedSong?.id === id) {
					setSelectedSong(null);
				}
				await fetchSongs();
			} else {
				alert("Failed to delete song");
			}
		} catch (err) {
			console.error("Delete error", err);
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
		<div className="flex flex-col items-center p-4 text-white font-sans">
			<div className="text-center mt-12 mb-10">
				{/* logo for Groovee*/}
				<h1 className="text-5xl font-bold text-green-500 mb-2">
					Groovee
				</h1>
			</div>
			<div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div className="flex flex-col gap-6">
					<div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800">
						<h3 className="text-lg font-semibold mb-4 text-white">Import Song</h3>
						<div className="flex flex-col gap-3">
							<input
								type="text"
								placeholder="Spotify URL"
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
							{error && <p className="text-red-500 text-xs mt-1">{error}</p>}
						</div>
					</div>
					<div className="bg-neutral-900 rounded-2xl border border-neutral-800 flex-1 overflow-hidden flex flex-col h-[500px]">
						<div className="p-4">
							<h3 className="text-lg font-semibold">Songs in database</h3>
						</div>
						<div className="overflow-y-auto flex-1 p-2 space-y-2">
							{songs.length === 0 && (
								<div className="text-center text-neutral-500 text-sm my-10">
									No songs imported yet.
								</div>
							)}
							{songs.map(song => (
								<div
									key={song.id}
									onClick={() => setSelectedSong(song)}
									className={`group relative p-3 rounded-lg cursor-pointer transition-all border ${
										selectedSong?.id === song.id
											? "bg-neutral-800 border-green-500/50"
											: "hover:bg-neutral-800 border-transparent"
									}`}
								>
									<div className="pr-8">
										<div className="font-medium text-sm truncate">
											{song.track_name}
										</div>
										<div className="text-xs text-neutral-400 truncate">
											{song.artist}
										</div>
									</div>
									<button
										onClick={e => handleDelete(e, song.id)}
										className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-neutral-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
										title="Delete song"
									>
										{/* took this shi striaght from https://icons.getbootstrap.com/icons/trash/ */}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="16"
											height="16"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
										>
											<path d="M3 6h18"></path>
											<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
											<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
										</svg>
									</button>
								</div>
							))}
						</div>
					</div>
				</div>

				<div className="lg:col-span-2">
					{selectedSong ? (
						<div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 h-full flex flex-col animate-in fade-in duration-500">
							<div className="mb-8">
								<h2 className="text-4xl font-bold text-white mb-2">
									{selectedSong.track_name}
								</h2>
								<div className="flex items-center gap-2 text-neutral-400 text-lg">
									{selectedSong.artist}
								</div>
							</div>

							<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
								<FeatureCard
									label="Danceability"
									value={selectedSong.audioFeatures.danceability}
									color="bg-pink-500"
									description="The danceability of the song"
								/>
								<FeatureCard
									label="Energy"
									value={selectedSong.audioFeatures.energy}
									color="bg-yellow-500"
									description="How much energy is in a song"
								/>
								<FeatureCard
									label="Valence (Mood)"
									value={selectedSong.audioFeatures.valence}
									color="bg-purple-500"
									description="Musical positiveness (Happy vs Sad)"
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
									description="Overall loudness of a track in decibels"
								/>
							</div>
						</div>
					) : (
						<div className="h-full flex flex-col items-center justify-center text-neutral-500 border border-neutral-800 rounded-2xl bg-neutral-900">
							<p>Select a song from the database to visualize</p>
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
