import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params;
  try {
    const gatewayUrl = process.env.PINATA_GATEWAY || "gateway.pinata.cloud";
    const url = `https://${gatewayUrl}/ipfs/${cid}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Pinata error ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Private file not accessible" },
      { status: 403 }
    );
  }
}
