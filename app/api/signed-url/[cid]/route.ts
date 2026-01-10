import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/pinata";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  try {
    if (!cid) {
      return NextResponse.json(
        { error: "CID parameter is required" },
        { status: 400 }
      );
    }

    // Get expiration time from query or default to 60 seconds
    const expiresIn = parseInt(req.nextUrl.searchParams.get("expiresIn") || "60");

    // Use the refactored Pinata service
    const signedUrl = await getSignedUrl(cid, expiresIn);

    return NextResponse.json({
      success: true,
      url: signedUrl,
      expiresIn: expiresIn,
    });
  } catch (error) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create signed URL",
      },
      { status: 500 }
    );
  }
}
