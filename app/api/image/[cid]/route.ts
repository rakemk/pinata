import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL;
  const gatewayToken = process.env.GATEWAY_TOKEN;

  try {
    if (!cid) {
      return NextResponse.json(
        { error: "CID parameter is required" },
        { status: 400 }
      );
    }

    if (!gatewayUrl || !gatewayToken) {
      return NextResponse.json(
        { error: "Gateway configuration missing" },
        { status: 500 }
      );
    }

    // Fetch from Pinata using Gateway Token in header to bypass 403 errors
    const response = await fetch(
      `https://${gatewayUrl}/ipfs/${cid}`,
      {
        method: "GET",
        headers: {
          "x-pinata-gateway-token": gatewayToken,
        },
      }
    );

    if (!response.ok) {
      console.error(`Gateway responded with ${response.status}`);
      return NextResponse.json(
        { error: `Pinata error: ${response.statusText}` },
        { status: response.status }
      );
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/png";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Get image error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
