"use client";

import { useState, useEffect } from "react";
import type { ArtistAnalytics, AlbumAnalytics } from "@/utils/types";

export default function AnalyticsPage() {
	const [analytics, setAnalytics] = useState<{
		topArtists: ArtistAnalytics[];
		longestAlbums: AlbumAnalytics[];
	} | null>(null);

	useEffect(() => {
		fetchAnalytics();
	}, []);

	const fetchAnalytics = async () => {
		try {
			const res = await fetch("/api/analytics");
			const data = await res.json();
			if (data.success) {
				setAnalytics(data.data);
			}
		} catch (err) {
			console.error("Failed to fetch analytics:", err);
		}
	};

	return (
		<div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
			<div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
				<h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
					High Energy Artists
				</h3>
				<p className="text-neutral-400 text-sm mb-6">
					Artists with the most average energy from all of therir songs in the database
				</p>
				<div className="space-y-4">
					{analytics?.topArtists.map((artist, i) => (
						<div
							key={i}
							className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-lg border border-neutral-800/50"
						>
							<div className="flex items-center gap-3">
								<span className="text-neutral-500 font-mono text-sm">
									#{i + 1}
								</span>
								<div>
									<div className="font-medium text-white">
										{artist.name}
									</div>
									<div className="text-xs text-neutral-500">
										{artist.track_count} tracks saved
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-yellow-500 font-bold">
									{(Number(artist.avg_energy) * 100).toFixed(0)}%
								</div>
								<div className="text-xs text-neutral-600">
									Avg enerrgy
								</div>
							</div>
						</div>
					))}
					{(!analytics?.topArtists || analytics.topArtists.length === 0) && (
						<div className="text-neutral-500 text-center py-4">
							No data available
						</div>
					)}
				</div>
			</div>

			<div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
				<h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
					Longest Albums
				</h3>
				<p className="text-neutral-400 text-sm mb-6">Longest albums in the database</p>
				<div className="space-y-4">
					{analytics?.longestAlbums.map((album, i) => (
						<div
							key={i}
							className="flex items-center justify-between p-3 bg-neutral-950/50 rounded-lg border border-neutral-800/50"
						>
							<div className="flex items-center gap-3">
								<span className="text-neutral-500 font-mono text-sm">
									#{i + 1}
								</span>
								<div>
									<div className="font-medium text-white">
										{album.name}
									</div>
									<div className="text-xs text-neutral-500">
										{album.track_count} tracks saved
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-blue-500 font-bold">
									{Math.round(album.total_duration_minutes)} min
								</div>
								<div className="text-xs text-neutral-600">
									Total minutes
								</div>
							</div>
						</div>
					))}
					{(!analytics?.longestAlbums || analytics.longestAlbums.length === 0) && (
						<div className="text-neutral-500 text-center py-4">
							No data available
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
