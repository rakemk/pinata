import { NextResponse } from 'next/server';
import { listPinataFiles, extractMeta, getSignedUrl } from '@/lib/pinata';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit') ?? 20);
    const offset = Number(searchParams.get('offset') ?? 0);
    const currentFolder = (searchParams.get('folder') || 'root').replace(/^\/|\/$/g, '');
    // 1. Process all files metadata first (Fetch 200 to ensure we see thumbnails)
    const result = await listPinataFiles(200);

    const allProcessedFiles = (result.files || []).map((file: any) => {
      const meta = extractMeta(file);
      return {
        id: file.id,
        ipfsHash: file.cid,
        name: file.name || 'Unnamed',
        size: file.size,
        uploadedAt: meta.uploadedAt,
        isImage: /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name),
        folder: (meta.folder || 'root').replace(/^\/|\/$/g, ''),
        path: meta.path,
        type: meta.type,
      };
    });

    // 2. Identify primary files in the current folder
    const filesInFolder = allProcessedFiles.filter(f =>
      f.folder === currentFolder &&
      !f.name.toLowerCase().includes('_thumbnail')
    );

    // 3. Smart Thumbnail Linking
    const filesWithThumbnails = await Promise.all(filesInFolder.map(async (file) => {
      let thumbnail = null;

      if (file.isImage) {
        // Base name without extension: "front_facing"
        const dotIndex = file.name.lastIndexOf('.');
        const baseName = dotIndex !== -1 ? file.name.slice(0, dotIndex) : file.name;

        // Desired target: "front_facing_thumbnail"
        const targetThumbPrefix = `${baseName}_thumbnail`.toLowerCase();

        // Possible locations to look for the thumbnail
        const thumbFolder = `${file.folder}_thumbnail`;
        const sameFolder = file.folder;

        // Search registry for ANY file that starts WITH our target name and is in the thumb/same folder
        const manualThumbFile = allProcessedFiles.find(f => {
          const fDotIndex = f.name.lastIndexOf('.');
          const fBaseName = fDotIndex !== -1 ? f.name.slice(0, fDotIndex) : f.name;

          return (f.folder === thumbFolder || f.folder === sameFolder) &&
            fBaseName.toLowerCase() === targetThumbPrefix;
        });

        if (manualThumbFile) {
          console.log(`✅ MATCH: Linked [${file.name}] to manual thumbnail [${manualThumbFile.name}] (${manualThumbFile.ipfsHash})`);
          thumbnail = await getSignedUrl(manualThumbFile.ipfsHash, 300);
        } else {
          // If no manual thumbnail is found, fallback to auto-optimization
          thumbnail = await getSignedUrl(file.ipfsHash, 300, 50, 50);
        }
      }

      return { ...file, thumbnail };
    }));

    // 4. Calculate Subfolders (excluding any folders named _thumbnail)
    const subfolders = Array.from(new Set(
      allProcessedFiles
        .filter(f => currentFolder === 'root' ? f.folder !== 'root' : f.folder.startsWith(currentFolder + '/'))
        .map(f => {
          const relativePart = currentFolder === 'root' ? f.folder : f.folder.replace(currentFolder + '/', '');
          return relativePart.split('/')[0];
        })
        .filter(folderName => !!folderName && !folderName.endsWith('_thumbnail'))
    ));

    return NextResponse.json({
      success: true,
      count: filesWithThumbnails.length,
      currentFolder,
      files: filesWithThumbnails,
      folders: subfolders,
    });
  } catch (error) {
    console.error('List files error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list files' },
      { status: 500 }
    );
  }
}
