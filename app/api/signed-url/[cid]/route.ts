import { NextRequest, NextResponse } from "next/server";
import { PinataSDK } from "pinata";

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

    const pinataJwt = process.env.PINATA_JWT;
    const pinataGateway = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";

    if (!pinataJwt) {
      return NextResponse.json(
        { error: "PINATA_JWT is not configured. Add it to .env.local" },
        { status: 500 }
      );
    }

    // Initialize Pinata SDK
    const pinata = new PinataSDK({
      pinataJwt: pinataJwt,
      pinataGateway: pinataGateway,
    });

    // Get expiration time from query or default to 1 hour (in seconds)
    const expiresIn = parseInt(req.nextUrl.searchParams.get("expiresIn") || "3600");

    // Create signed URL using Pinata SDK
    const signedUrl = await pinata.gateways.private.createAccessLink({
      cid: cid,
      expires: expiresIn,
    });

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
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
