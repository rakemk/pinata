# Pinata File Manager - Copilot Instructions

This is a Next.js application for uploading, downloading, and managing files using Pinata cloud storage.

## Project Setup Status

- ✅ Framework: Next.js 16 with TypeScript and Tailwind CSS
- ✅ API Routes: Upload, List Files, and Get File Details
- ✅ Pinata Client: Utility wrapper for Pinata API operations
- ✅ UI: Modern React component with drag-and-drop file upload
- ✅ Build: Successfully compiled with no errors
- ✅ Dependencies: All packages installed

## Key Files

- **[app/page.tsx](../app/page.tsx)** - Main UI component with file upload and management
- **[app/api/upload/route.ts](../app/api/upload/route.ts)** - File upload endpoint
- **[app/api/files/route.ts](../app/api/files/route.ts)** - List files endpoint
- **[app/api/files/[cid]/route.ts](../app/api/files/[cid]/route.ts)** - Get file details endpoint
- **[lib/pinata.ts](../lib/pinata.ts)** - Pinata API client wrapper
- **[.env.local.example](.env.local.example)** - Environment variables template

## Running the Application

### Development
```bash
npm run dev
# Application runs on http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

## Configuration

Before running the application:

1. Copy environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Pinata JWT token to `.env.local`:
   ```env
   PINATA_JWT=your_jwt_token_from_pinata
   ```

3. Get your JWT from [app.pinata.cloud](https://app.pinata.cloud) → Developers → API Keys

## API Endpoints

- `POST /api/upload` - Upload files to Pinata
- `GET /api/files` - List all uploaded files
- `GET /api/files/[cid]` - Get details for a specific file

## Features

- 📤 Upload files up to 50MB to Pinata IPFS
- 📥 Download files via Pinata gateway
- 📋 View file metadata and history
- 🔒 Secure server-side authentication with JWT
- 👤 User-based file access control
- 🎨 Responsive dark mode UI
- ⚡ Real-time file list updates

## Tech Stack

- Next.js 16 with App Router
- TypeScript for type safety
- Tailwind CSS 4 for styling
- Axios for HTTP requests
- Pinata API for IPFS storage
- ESLint for code quality

## Important Notes

- Never commit `.env.local` with real credentials
- File uploads are limited to 50MB
- JWT token is required for API operations
- All file uploads include metadata for tracking
- Files are permanently stored on IPFS (immutable)

## Troubleshooting

If files won't upload:
- Verify `PINATA_JWT` is correctly set
- Check file size (must be under 50MB)
- Check browser console for error details

For development changes, the dev server will hot-reload automatically.
