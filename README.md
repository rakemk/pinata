# 📁 Pinata File Manager

A modern Next.js application for uploading, downloading, and managing files using Pinata as a secure, decentralized cloud storage service. Built with TypeScript, Tailwind CSS, and modern React patterns.

## ✨ Features

- **📤 Upload Files** – Upload images and files (up to 50MB) to Pinata IPFS
- **📥 Download Files** – Securely fetch files stored on Pinata via IPFS gateway
- **📋 List Files** – View uploaded files with metadata (name, size, type, upload time)
- **🔒 Secure API Routes** – Server-side uploads using Pinata JWT authentication
- **👤 User-Based Access Control** – Files can be mapped to users for multi-user support
- **🎨 Modern UI** – Clean, responsive interface with dark mode support using Tailwind CSS
- **⚡ Real-time Updates** – Auto-refresh file lists after uploads

## 🛠 Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | React framework with App Router |
| **TypeScript** | Type-safe development |
| **Tailwind CSS 4** | Utility-first styling |
| **Axios** | HTTP client for API calls |
| **Pinata API** | Decentralized file storage via IPFS |
| **ESLint** | Code quality and linting |

## 📋 Prerequisites

- **Node.js 18+** or higher
- **npm**, **yarn**, or **pnpm** package manager
- A **Pinata account** (free tier available at [pinata.cloud](https://pinata.cloud))
- Pinata **JWT token** for authentication

## 🚀 Quick Start

### 1. Setup Environment Variables

Copy the example env file and add your Pinata credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
PINATA_JWT=your_jwt_token_from_pinata
```

**Getting your JWT token:**
1. Visit [app.pinata.cloud](https://app.pinata.cloud)
2. Sign in or create an account
3. Go to **Developers** → **API Keys**
4. Click **Create API Key** → Enable JWT signing
5. Copy the JWT token and paste it in `.env.local`

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## 📂 Project Structure

```
nextjs-pinata-file-manager/
├── app/
│   ├── api/
│   │   ├── upload/
│   │   │   └── route.ts              # POST /api/upload - Upload files
│   │   └── files/
│   │       ├── route.ts              # GET /api/files - List files
│   │       └── [cid]/
│   │           └── route.ts          # GET /api/files/:cid - Get file details
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Main UI component
│   └── globals.css                   # Global styles
├── lib/
│   └── pinata.ts                     # Pinata client wrapper
├── public/                           # Static assets
├── .env.local.example                # Environment variables template
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── next.config.ts                    # Next.js config
└── README.md                         # This file
```

## 🔌 API Routes

### POST `/api/upload`
Upload a file to Pinata.

**Request:**
```bash
curl -X POST http://localhost:3000/api/upload \
  -H "x-filename: myfile.pdf" \
  -H "x-user-id: user123" \
  --data-binary @myfile.pdf
```

**Response:**
```json
{
  "success": true,
  "ipfsHash": "QmXxxx...",
  "pinSize": 1024000,
  "filename": "myfile.pdf",
  "timestamp": "2025-12-27T10:00:00Z"
}
```

### GET `/api/files`
List all uploaded files.

**Query Parameters:**
- `limit` - Number of files to return (default: 10)
- `offset` - Pagination offset (default: 0)
- `userId` - Filter by user ID (optional)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "total": 10,
  "files": [
    {
      "id": "abc123",
      "ipfsHash": "QmXxxx...",
      "name": "document.pdf",
      "size": 1024000,
      "uploadedAt": "2025-12-27T10:00:00Z",
      "url": "https://gateway.pinata.cloud/ipfs/QmXxxx..."
    }
  ]
}
```

### GET `/api/files/[cid]`
Get details for a specific file by its IPFS hash (CID).

**Response:**
```json
{
  "success": true,
  "file": {
    "id": "abc123",
    "ipfsHash": "QmXxxx...",
    "name": "document.pdf",
    "size": 1024000,
    "uploadedAt": "2025-12-27T10:00:00Z",
    "url": "https://gateway.pinata.cloud/ipfs/QmXxxx..."
  }
}
```

## 🎯 Usage

### Basic File Upload
The UI provides a drag-and-drop interface:
1. Drop a file on the upload area (or click to browse)
2. File is uploaded to Pinata via `/api/upload`
3. File appears in the files list after successful upload

### Downloading Files
Click the **Download** button next to any file to open it in a new tab via the Pinata gateway.

### User-Based Access
Each upload can include a `userId` header to track which user uploaded the file. Filter files by user ID in the API.

## 🔐 Security Considerations

- **JWT Authentication**: Server-side API routes use Pinata JWT tokens
- **File Size Limits**: Default 50MB limit enforced on both client and server
- **User Isolation**: Optional user-based filtering prevents unauthorized access
- **HTTPS**: Deploy with HTTPS in production
- **Environment Variables**: Never commit `.env.local` to version control

## 🚢 Deployment

### Deploy on Vercel (Recommended)

```bash
npm install -g vercel
vercel login
vercel
```

### Deploy on Other Platforms

1. Build the project: `npm run build`
2. Set environment variables on your hosting platform
3. Configure start command: `npm start`

**Important:** Set `PINATA_JWT` environment variable on your hosting platform.

## 🔄 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `PINATA_JWT` | ✅ Yes | JWT token from Pinata API keys |
| `PINATA_API_KEY` | ❌ No | Alternative to JWT (not recommended) |
| `PINATA_API_SECRET` | ❌ No | Paired with API_KEY |
| `NEXT_PUBLIC_MAX_FILE_SIZE` | ❌ No | Max upload size in bytes (default: 50MB) |

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Pinata API Docs](https://docs.pinata.cloud)
- [IPFS Documentation](https://docs.ipfs.tech)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Troubleshooting

### Files not uploading?
- Check that `PINATA_JWT` is set correctly in `.env.local`
- Verify file size is under 50MB
- Check browser console for error messages

### Can't connect to Pinata?
- Ensure JWT token is valid and not expired
- Check network connectivity
- Verify Pinata API is not down

### Styling looks off?
- Clear `.next` directory: `rm -rf .next`
- Rebuild: `npm run build`
- Clear browser cache

## 📞 Support

For issues with Pinata, visit [Pinata Support](https://support.pinata.cloud)
For Next.js issues, check [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
