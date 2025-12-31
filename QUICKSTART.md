# Quick Start Guide - Pinata File Manager

## Prerequisites
- Node.js 18+ installed
- Pinata account (free at [pinata.cloud](https://pinata.cloud))

## Setup in 3 Steps

### 1️⃣ Get Your Pinata JWT Token
1. Go to [app.pinata.cloud](https://app.pinata.cloud)
2. Sign in or create account
3. Navigate to **Developers** → **API Keys**
4. Click **Create API Key**
5. Enable "JWT Signing"
6. Copy the JWT token

### 2️⃣ Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and paste your JWT:
```env
PINATA_JWT=your_token_here
```

### 3️⃣ Run the Application
```bash
npm install    # Install dependencies (already done)
npm run dev    # Start development server
```

Open [http://localhost:3000](http://localhost:3000) in your browser

## Using the App

### Upload Files
- Click the upload area or drag & drop a file
- File size limit: 50MB
- Automatically syncs to Pinata after upload

### Download Files
- Click the **⬇️ Download** button next to any file
- File opens in a new tab via Pinata gateway

### View File Details
- See file name, size, and upload date
- IPFS hash shown for verification

## Build for Production
```bash
npm run build
npm start
```

## Project Structure
```
pinata/
├── app/
│   ├── api/
│   │   ├── upload/route.ts      # Upload endpoint
│   │   └── files/
│   │       ├── route.ts         # List files
│   │       └── [cid]/route.ts   # Get file details
│   ├── page.tsx                 # Main UI
│   └── layout.tsx               # Root layout
├── lib/
│   └── pinata.ts                # Pinata client
├── .env.local                   # Your config (not in git)
└── package.json
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/upload` | Upload file to Pinata |
| GET | `/api/files` | List uploaded files |
| GET | `/api/files/[cid]` | Get file details |

## Troubleshooting

**Files won't upload?**
- Check `PINATA_JWT` is set in `.env.local`
- Verify file size < 50MB
- Check browser console for errors

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**Need to rebuild?**
```bash
rm -rf .next
npm run build
```

## Next Steps

- Add authentication for user-based file access
- Implement file deletion/unpinning
- Add file categories or tags
- Create file sharing features
- Deploy to Vercel, Netlify, or your server

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Pinata API Docs](https://docs.pinata.cloud)
- [IPFS Concepts](https://docs.ipfs.tech)

Enjoy using Pinata File Manager! 🚀
