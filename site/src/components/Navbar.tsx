"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
	const pathname = usePathname();

	return (
		<div className="flex gap-2 mb-8 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
			<Link
				href="/"
				className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
					pathname === "/"
						? "bg-neutral-800 text-white shadow-sm border border-neutral-700"
						: "text-neutral-500 hover:text-white"
				}`}
			>
				My Library
			</Link>
			<Link
				href="/analytics"
				className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
					pathname === "/analytics"
						? "bg-neutral-800 text-white shadow-sm border border-neutral-700"
						: "text-neutral-500 hover:text-white"
				}`}
			>
				Analytics
			</Link>
		</div>
	);
}
