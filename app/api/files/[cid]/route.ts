import { NextRequest, NextResponse } from "next/server";
import { pinataClient } from "@/lib/pinata";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  try {
    const { cid } = await params;

    if (!cid) {
      return NextResponse.json(
        { error: "CID parameter is required" },
        { status: 400 }
      );
    }

    // Get file info from Pinata
    const file = await pinataClient.getFile(cid);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    // Return file info and download URL
    return NextResponse.json(
      {
        success: true,
        file: {
          id: file.id,
          ipfsHash: file.ipfs_pin_hash,
          name: file.metadata?.name || "Unnamed",
          size: file.size,
          uploadedAt: file.date_pinned,
          metadata: file.metadata?.keyvalues,
          url: pinataClient.getFileUrl(file.ipfs_pin_hash),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get file error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to retrieve file";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
