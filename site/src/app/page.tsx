"use client";

import { useState, useEffect } from "react";
import type { SongData } from "@/utils/types";
import FeatureCard from "@/components/FeatureCard";

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
		<div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
			<div className="flex flex-col gap-6">
				<div className="bg-neutral-900 p-5 rounded-lg border border-neutral-700">
					<h3 className="text-lg font-semibold mb-3 text-white">Add Song</h3>
					<div className="flex flex-col gap-2">
						<input
							type="text"
							placeholder="Spotify URL"
							value={url}
							onChange={e => setUrl(e.target.value)}
							className="w-full p-2 rounded bg-neutral-800 border border-neutral-600 focus:border-green-500 outline-none text-sm"
						/>
						<button
							onClick={handleAnalyze}
							disabled={loading || !url}
							className="w-full py-2 rounded bg-green-600 hover:bg-green-500 disabled:opacity-50 text-sm"
						>
							{loading ? "adding..." : "Add Song"}
						</button>
						{error && <p className="text-red-500 text-xs mt-1">{error}</p>}
					</div>
				</div>
				<div className="bg-neutral-900 rounded-lg border border-neutral-700 flex-1 overflow-hidden flex flex-col h-[500px]">
					<div className="p-3 border-b border-neutral-700">
						<h3 className="font-semibold">Songs in database</h3>
					</div>
					<div className="overflow-y-auto flex-1 p-2">
						{songs.length === 0 && (
							<div className="text-center text-neutral-500 text-sm my-10">
								No songs imported yet.
							</div>
						)}
						{songs.map(song => (
							<div
								key={song.id}
								onClick={() => setSelectedSong(song)}
								className={`group relative p-2 rounded cursor-pointer ${selectedSong?.id === song.id
										? "bg-green-900/30 border-l-2 border-green-500"
										: "hover:bg-neutral-800"
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
									className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-neutral-600 hover:text-red-400"
									title="Delete"
								>
									{/* took this shi striaght from https://icons.getbootstrap.com/icons/trash/ */}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										width="14"
										height="14"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2"
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
					<div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 h-full flex flex-col">
						<div className="mb-6">
							<h2 className="text-3xl font-bold text-white mb-1">
								{selectedSong.track_name}
							</h2>
							<p className="text-neutral-400">
								by {selectedSong.artist}
							</p>
						</div>

						<h4 className="text-sm text-neutral-500 mb-3">Audio Features</h4>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
								value={(selectedSong.audioFeatures.loudness + 60) / 60}
								displayValue={`${selectedSong.audioFeatures.loudness.toFixed(1)} dB`}
								color="bg-blue-500"
								description="overall loudness of a track in dB"
							/>
						</div>
					</div>
				) : (
					<div className="h-full flex flex-col items-center justify-center text-neutral-500 border border-neutral-700 rounded-lg bg-neutral-900">
						<p>select a song from the database to visualize</p>
					</div>
				)}
			</div>
		</div>
	);
}
