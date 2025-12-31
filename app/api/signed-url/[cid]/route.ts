import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
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

    const domain = process.env.NEXT_PUBLIC_GATEWAY_URL;
    const token = process.env.GATEWAY_TOKEN;

    if (!domain || !token) {
      return NextResponse.json(
        { error: "Gateway configuration missing" },
        { status: 500 }
      );
    }

    // Construct URL with gateway token
    const url = `https://${domain}/ipfs/${cid}?pinataGatewayToken=${token}`;
    
    console.log(`Created signed URL for CID: ${cid}`);

    return NextResponse.json({
      success: true,
      url: url,
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
