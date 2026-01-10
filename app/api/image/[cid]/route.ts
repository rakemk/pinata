import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  try {
    const pinataJwt = process.env.PINATA_JWT;
    const pinataGateway = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

    if (!pinataJwt) {
      return NextResponse.json(
        { error: "PINATA_JWT is not configured" },
        { status: 500 }
      );
    }

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt,
      pinataGateway: pinataGateway,
    });

    // Create signed URL for private file (valid for 1 hour)
    const signedUrl = await pinata.gateways.private.createAccessLink({
      cid: cid,
      expires: 3600, // 1 hour
    });

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
