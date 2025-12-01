import { NextResponse } from "next/server";
import { deleteSong } from "@/utils/db";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params;
		const trackId = parseInt(id);

		if (isNaN(trackId)) {
			return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
		}

		await deleteSong(trackId);

		return NextResponse.json({ success: true, message: "Song deleted successfully" });
	} catch (error: any) {
		console.error("Delete Error:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}
