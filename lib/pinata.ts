import { PinataSDK } from 'pinata';

const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
});

export async function uploadToPinata(file: File, folder?: string, path?: string) {
  // Upload with metadata using SDK options
  const result = await pinata.upload.private.file(file, {
    metadata: {
      name: file.name,
      keyvalues: {
        folder: folder || 'root',
        path: path || file.name,
        type: file.type || 'file',
        uploadedAt: new Date().toISOString(),
      },
    },
  });
  return result;
}

export async function uploadFolderToPinata(files: File[], folderName?: string) {
  if (files.length === 0) throw new Error('No files provided');

  // Use provided folder name or derive from the first file's relative path
  const firstPath = (files[0] as any).webkitRelativePath as string | undefined;
  const derivedFolder = firstPath ? firstPath.split('/')[0] || 'upload' : `upload-${Date.now()}`;
  const folder = folderName || derivedFolder;

  const uploads = await Promise.all(
    files.map((file) => {
      // Keep the relative path so inner structure stays intact under the single folder
      const relPath = (file as any).webkitRelativePath || file.name;
      return uploadToPinata(file, folder, relPath);
    })
  );

  return { folder, files: uploads };
}

export async function listPinataFiles(limit = 100, offset = 0) {
  const result = await pinata.files.private.list();
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

export function getPinataJWT() {
  return process.env.PINATA_JWT!;
}
