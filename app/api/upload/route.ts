import { NextResponse } from 'next/server';
import { uploadToPinata } from '@/lib/pinata';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll('file') as File[];
    const folderName = (form.get('folderName') as string | null) || undefined;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'File missing' }, { status: 400 });
    }

    // Detect folder upload via webkitRelativePath
    const isFolder = (files[0] as any).webkitRelativePath;

    if (isFolder || files.length > 1) {
      // Upload multiple files with shared folder metadata
      const firstPath = (files[0] as any).webkitRelativePath as string | undefined;
      const derivedFolder = firstPath ? firstPath.split('/')[0] || 'upload' : `upload-${Date.now()}`;
      const folder = folderName || derivedFolder;

      const uploads = await Promise.all(
        files.map(async (file) => {
          const relPath = (file as any).webkitRelativePath || file.name;
          return uploadToPinata(file, folder, relPath);
        })
      );

      return NextResponse.json({
        success: true,
        folder,
        count: uploads.length,
        files: uploads.map((u) => ({ cid: u.cid })),
      });
    }

    // Single file
    const result = await uploadToPinata(files[0], folderName, files[0].name);
    return NextResponse.json({
      success: true,
      cid: result.cid,
      url: `https://gateway.pinata.cloud/ipfs/${result.cid}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
