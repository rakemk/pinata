import { NextRequest, NextResponse } from "next/server";
import { getSignedUrl } from "@/lib/pinata";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  try {
    // Create signed URL for private file (valid for 1 hour for preview/proxy)
    const signedUrl = await getSignedUrl(cid, 3600);

    // Fetch the file data using the signed URL
    const response = await fetch(signedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Image preview error:", err);
    return NextResponse.json(
      { error: "Failed to load image", details: err.message },
      { status: 403 }
    );
  }
}
