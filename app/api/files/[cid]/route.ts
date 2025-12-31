import { NextRequest, NextResponse } from "next/server";
import { listPinataFiles, extractMeta } from "@/lib/pinata";

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

    const result = await listPinataFiles(100, 0);
    const file = result.files?.find((f: any) => f.cid === cid);

    if (!file) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    const meta = extractMeta(file);

    return NextResponse.json(
      {
        success: true,
        file: {
          id: file.id,
          ipfsHash: file.cid,
          name: file.name || "Unnamed",
          size: file.size,
          uploadedAt: meta.uploadedAt,
          folder: meta.folder,
          path: meta.path,
          type: meta.type,
          metadata: file.metadata,
          url: `https://gateway.pinata.cloud/ipfs/${file.cid}`,
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
