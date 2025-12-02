"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
	const pathname = usePathname();

	return (
		<div className="flex gap-2 mb-8">
			<Link
				href="/"
				className={`px-5 py-2 rounded text-sm ${
					pathname === "/"
						? "bg-green-600 text-white"
						: "bg-neutral-800 text-neutral-400 hover:text-white"
				}`}
			>
				My Library
			</Link>
			<Link
				href="/analytics"
				className={`px-5 py-2 rounded text-sm ${
					pathname === "/analytics"
						? "bg-green-600 text-white"
						: "bg-neutral-800 text-neutral-400 hover:text-white"
				}`}
			>
				Analytics
			</Link>
		</div>
	);
}
