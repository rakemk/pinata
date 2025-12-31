import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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

    const gatewayUrl = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
    const pinataSecret = process.env.PINATA_API_SECRET;

    if (!pinataSecret) {
      return NextResponse.json(
        { error: "PINATA_API_SECRET is not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    // Get expiration time from query or default to 1 hour from now
    const expiresIn = parseInt(req.nextUrl.searchParams.get("expiresIn") || "3600");
    const expires = Math.floor(Date.now() / 1000) + expiresIn;

    // Create signature: HMAC-SHA256 of CID + expires
    const data = `${cid}${expires}`;
    const signature = crypto
      .createHmac("sha256", pinataSecret)
      .update(data)
      .digest("hex");

    // Construct signed URL
    const url = `https://${gatewayUrl}/ipfs/${cid}?expires=${expires}&signature=${signature}`;

    return NextResponse.json({
      success: true,
      url: url,
      expires: expires,
      signature: signature,
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
