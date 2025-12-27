import { NextRequest, NextResponse } from "next/server";
import { pinataClient } from "@/lib/pinata";

export async function GET(request: NextRequest) {
  try {
    // Check for JWT token
    if (!process.env.PINATA_JWT) {
      return NextResponse.json(
        { error: "Pinata JWT not configured" },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const userId = searchParams.get("userId") || "anonymous";

    // List files from Pinata
    const result = await pinataClient.listFiles(limit, offset);

    // Filter by userId if metadata contains it (optional)
    const filteredRows = result.rows.filter((file) => {
      const metadata = file.metadata?.keyvalues as Record<string, unknown>;
      if (userId && userId !== "all") {
        return metadata?.userId === userId;
      }
      return true;
    });

    return NextResponse.json(
      {
        success: true,
        count: filteredRows.length,
        total: result.count,
        files: filteredRows.map((file) => ({
          id: file.id,
          ipfsHash: file.ipfs_pin_hash,
          name: file.metadata?.name || "Unnamed",
          size: file.size,
          uploadedAt: file.date_pinned,
          metadata: file.metadata?.keyvalues,
          url: `https://gateway.pinata.cloud/ipfs/${file.ipfs_pin_hash}`,
        })),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("List files error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to list files";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
