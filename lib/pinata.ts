import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
});

/**
 * 1. Upload file to private
 */
export async function uploadToPinata(file: File, folder: string = 'root', path?: string) {
  // Ensure we don't have leading/trailing slashes for consistency
  const cleanFolder = folder.replace(/^\/|\/$/g, '') || 'root';

  const result = await pinata.upload.private.file(file, {
    metadata: {
      name: file.name,
      keyvalues: {
        folder: cleanFolder,
        path: path || file.name,
        fullPath: `${cleanFolder}/${file.name}`,
        type: file.type || 'file',
        uploadedAt: new Date().toISOString(),
      },
    },
  });
  return result;
}

/**
 * 2. Get signed URL for temporary access
 * @param cid IPFS hash
 * @param expiresInSeconds Duration in seconds (default: 60)
 * @param width Optional width for image optimization
 * @param height Optional height for image optimization
 */
export async function getSignedUrl(
  cid: string,
  expiresInSeconds: number = 60,
  width?: number,
  height?: number
) {
  const options: any = {
    cid: cid,
    expires: expiresInSeconds,
  };

  if (width || height) {
    options.optimizeImage = {
      width: width,
      height: height,
      format: 'webp',
      quality: 30, // Very low quality for thumbnails to force optimization
      fit: 'cover'  // 'cover' is often more reliable than 'scaleDown' for forcing a resize
    };
  }

  console.log(`Generating signed URL for ${cid} using gateway: ${process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'}`);
  const signedUrl = await pinata.gateways.private.createAccessLink(options);
  return signedUrl;
}

export async function listPinataFiles(limit = 100) {
  // Fetch a larger list to ensure we can match thumbnails across folders
  const result = await pinata.files.private.list().limit(limit);
  return result;
}

export function extractMeta(file: any) {
  const kv = (file as any).metadata?.keyvalues || {};
  return {
    folder: kv.folder || 'root',
    path: kv.path || file.name,
    type: kv.type || 'file',
    uploadedAt: kv.uploadedAt || file.created_at,
  };
}

export async function uploadFolderToPinata(files: File[], folderName?: string) {
  if (files.length === 0) throw new Error('No files provided');

  const firstPath = (files[0] as any).webkitRelativePath as string | undefined;
  const derivedFolder = firstPath ? firstPath.split('/')[0] || 'upload' : `upload-${Date.now()}`;
  const folder = folderName || derivedFolder;

  const uploads = await Promise.all(
    files.map((file) => {
      const relPath = (file as any).webkitRelativePath || file.name;
      return uploadToPinata(file, folder, relPath);
    })
  );

  return { folder, files: uploads };
}
