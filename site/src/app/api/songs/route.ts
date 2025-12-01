import { NextResponse } from "next/server";
import { getAllSongs } from "@/utils/db";

export async function GET() {
	try {
		const songs = await getAllSongs();

		return NextResponse.json({
			success: true,
			data: songs,
		});
	} catch (error: any) {
		console.error("Database Error:", error);
		return NextResponse.json({ error: "Failed to fetch songs" }, { status: 500 });
	}
}
