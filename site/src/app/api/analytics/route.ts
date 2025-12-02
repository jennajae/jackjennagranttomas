import { NextResponse } from "next/server";
import { getAnalytics } from "@/utils/db";

export async function GET() {
	try {
		const data = await getAnalytics();

		return NextResponse.json({ success: true, data });
	} catch (error: any) {
		console.error("analytics errorr:", error);
		return NextResponse.json({ error: "failed to fetch analytics" }, { status: 500 });
	}
}
