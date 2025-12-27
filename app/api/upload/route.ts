import { NextRequest, NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { parse } from "formidable";
import { pinataClient } from "@/lib/pinata";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "100mb",
    },
  },
};

export async function POST(request: NextRequest) {
  try {
    // Check for JWT token
    if (!process.env.PINATA_JWT) {
      return NextResponse.json(
        { error: "Pinata JWT not configured" },
        { status: 500 }
      );
    }

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Content-Type must be multipart/form-data" },
        { status: 400 }
      );
    }

    // Convert NextRequest to a buffer-compatible format
    const buffer = await request.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // For this simple example, we'll create a direct upload
    // In production, you'd parse multipart form data properly
    const blob = new Blob([uint8Array], { type: "application/octet-stream" });

    // Extract filename from request (you might get this from form data)
    const filename = request.headers.get("x-filename") || `file-${Date.now()}`;
    const userId = request.headers.get("x-user-id") || "anonymous";

    // Upload to Pinata
    const result = await pinataClient.uploadFile(
      uint8Array as any,
      filename,
      {
        userId,
        uploadedAt: new Date().toISOString(),
      }
    );

    return NextResponse.json(
      {
        success: true,
        ipfsHash: result.IpfsHash,
        pinSize: result.PinSize,
        timestamp: result.Timestamp,
        filename,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to upload file";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
