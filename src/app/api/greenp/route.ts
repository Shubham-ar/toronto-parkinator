import { NextResponse } from "next/server";
import { fetchGreenPLots } from "@/lib/greenp";

export async function GET() {
  try {
    const { lots, meta } = await fetchGreenPLots();

    if (lots.length === 0) {
      return NextResponse.json(
        {
          error: "Unable to load Green P parking data",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      lots,
      meta: {
        source: meta.source,
        total: lots.length,
        cached: meta.cached,
        note: meta.note,
      },
    });
  } catch (error) {
    console.error("[api/greenp] unexpected error:", error);
    return NextResponse.json(
      {
        error: "Unable to load Green P parking data",
      },
      { status: 502 }
    );
  }
}
