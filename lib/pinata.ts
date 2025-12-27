import axios, { AxiosInstance } from "axios";
import { ReadStream } from "fs";

const PINATA_API_BASE = "https://api.pinata.cloud";

interface PinataConfig {
  jwt?: string;
  apiKey?: string;
  apiSecret?: string;
}

interface UploadResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
  isDuplicate?: boolean;
}

interface PinataFile {
  id: string;
  ipfs_pin_hash: string;
  size: number;
  user_id: string;
  content_address: string;
  date_pinned: string;
  date_unpinned: string | null;
  metadata: {
    name: string;
    keyvalues: Record<string, unknown>;
  };
  regions: Array<{
    regionId: string;
    currentReplicationCount: number;
    desiredReplicationCount: number;
  }>;
}

interface ListFilesResponse {
  count: number;
  rows: PinataFile[];
}

export class PinataClient {
  private client: AxiosInstance;
  private jwt: string;

  constructor(config: PinataConfig) {
    this.jwt = config.jwt || process.env.PINATA_JWT || "";

    if (!this.jwt) {
      console.warn("Pinata JWT token not configured. Using API key/secret instead.");
    }

    this.client = axios.create({
      baseURL: PINATA_API_BASE,
      headers: this.getHeaders(config),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
  }

  private getHeaders(config: PinataConfig) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.jwt) {
      headers.Authorization = `Bearer ${this.jwt}`;
    } else {
      headers["x-api-key"] = config.apiKey || process.env.PINATA_API_KEY || "";
      headers["x-secret-api-key"] = config.apiSecret || process.env.PINATA_API_SECRET || "";
    }

    return headers;
  }

  /**
   * Upload a file to Pinata
   */
  async uploadFile(
    file: Buffer | ReadStream,
    filename: string,
    metadata?: Record<string, unknown>
  ): Promise<UploadResponse> {
    try {
      const formData = new FormData();
      const blob = file instanceof Buffer ? new Blob([file]) : file;
      
      formData.append("file", blob, filename);

      if (metadata) {
        const metadataJson = {
          name: filename,
          keyvalues: metadata,
        };
        formData.append("pinataMetadata", JSON.stringify(metadataJson));
      }

      const response = await this.client.post<UploadResponse>("/pinning/pinFileToIPFS", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(`Failed to upload file to Pinata: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * List all files pinned to Pinata
   */
  async listFiles(
    limit: number = 10,
    offset: number = 0,
    filters?: {
      name?: string;
      status?: "pinned" | "unpinned" | "all";
      mimeType?: string;
    }
  ): Promise<ListFilesResponse> {
    try {
      const params: Record<string, unknown> = {
        limit,
        offset,
        status: filters?.status || "pinned",
      };

      if (filters?.name) {
        params.metadata = JSON.stringify({
          name: filters.name,
        });
      }

      const response = await this.client.get<ListFilesResponse>("/data/pinList", { params });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to list files from Pinata: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get a specific file by its IPFS hash
   */
  async getFile(ipfsHash: string): Promise<PinataFile | null> {
    try {
      const { rows } = await this.listFiles(100, 0);
      return rows.find((file) => file.ipfs_pin_hash === ipfsHash) || null;
    } catch (error) {
      throw new Error(`Failed to retrieve file from Pinata: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Unpin a file from Pinata
   */
  async unpinFile(ipfsHash: string): Promise<void> {
    try {
      await this.client.delete(`/pinning/unpin/${ipfsHash}`);
    } catch (error) {
      throw new Error(`Failed to unpin file from Pinata: ${this.getErrorMessage(error)}`);
    }
  }

  /**
   * Get the URL to download a file from Pinata gateway
   */
  getFileUrl(ipfsHash: string, gatewayUrl: string = "https://gateway.pinata.cloud"): string {
    return `${gatewayUrl}/ipfs/${ipfsHash}`;
  }

  private getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.error || error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}

// Export singleton instance
export const pinataClient = new PinataClient({});

export default PinataClient;
