import { NextResponse } from 'next/server';
import { listPinataFiles, extractMeta } from '@/lib/pinata';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') ?? 20);
    const offset = Number(searchParams.get('offset') ?? 0);

    const result = await listPinataFiles(limit, offset);

    const files = (result.files || []).map((file: any) => {
      const meta = extractMeta(file);
      return {
        id: file.id,
        ipfsHash: file.cid,
        name: file.name || 'Unnamed',
        size: file.size,
        uploadedAt: meta.uploadedAt,
        url: `https://gateway.pinata.cloud/ipfs/${file.cid}`,
        folder: meta.folder,
        path: meta.path,
        type: meta.type,
      };
    });

    const folders = Array.from(new Set(files.map((f: any) => f.folder).filter(Boolean)));
    return NextResponse.json({
      success: true,
      count: files.length,
      files,
      folders,
    });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    );
  }
}
