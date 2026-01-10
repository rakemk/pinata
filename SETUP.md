# Pinata Private Files - Setup Guide

## Environment Configuration

To use this application with Pinata private files and signed URLs, you need to configure the following environment variables in your `.env.local` file.

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Required: Your Pinata JWT token
PINATA_JWT=your_jwt_token_here

# Optional: Your Pinata gateway domain (default: gateway.pinata.cloud)
PINATA_GATEWAY=your-gateway.mypinata.cloud
```

### Getting Your Pinata Credentials

#### 1. Get Your JWT Token

1. Visit [app.pinata.cloud](https://app.pinata.cloud)
2. Sign in or create a free account
3. Navigate to **API Keys** in the sidebar
4. Click **New Key**
5. Give your key a name (e.g., "File Manager")
6. Enable the following permissions:
   - **pinFileToIPFS** (for uploads)
   - **pinJSONToIPFS** (for metadata)
   - **userPinnedDataTotal** (for listing files)
   - **pinList** (for listing files)
   - **unpin** (optional, for deleting files)
7. Click **Create Key**
8. Copy your JWT token immediately (it won't be shown again!)
9. Paste it in `.env.local` as `PINATA_JWT=your_token_here`

#### 2. Get Your Gateway Domain (Optional)

If you have a dedicated gateway:
1. Go to **Gateways** in the Pinata dashboard
2. Copy your gateway domain (e.g., `your-gateway.mypinata.cloud`)
3. Add it to `.env.local` as `PINATA_GATEWAY=your-gateway.mypinata.cloud`

If you don't have a dedicated gateway, the app will use the default Pinata gateway.

### Important Notes

⚠️ **Security**
- Never commit `.env.local` to version control
- The `.gitignore` file is already configured to exclude it
- Keep your JWT token secret

🔒 **Private Files**
- This application uses Pinata's **Private IPFS** feature
- Files uploaded are NOT publicly accessible
- Signed URLs are generated with temporary access (default: 1 hour)
- Signed URLs expire automatically for security

## Testing Your Configuration

After setting up your environment variables:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000)

3. Try uploading a test image

4. Click "Preview" to test signed URL generation

5. Click "Download" to test file download

If you see errors, check:
- Your `PINATA_JWT` is correct and has proper permissions
- Your gateway domain is correct (if using a custom one)
- Your environment variables are loaded (restart the dev server)

## Troubleshooting

### Error: "PINATA_JWT is not configured"
- Make sure `.env.local` exists in the root directory
- Verify the variable name is exactly `PINATA_JWT`
- Restart your development server

### Error: "Failed to create signed URL"
- Check that your JWT token has the correct permissions
- Verify the CID exists in your Pinata account
- Make sure the file is uploaded as a private file

### Preview/Download not working
- Check browser console for detailed error messages
- Verify the file exists in Pinata dashboard
- Try refreshing the file list

### Files not appearing in list
- Make sure files were uploaded through this app (with proper metadata)
- Check Pinata dashboard to see if files exist
- Try clicking "Refresh" button

## Additional Resources

- [Pinata Documentation](https://docs.pinata.cloud)
- [Pinata SDK Documentation](https://docs.pinata.cloud/sdk)
- [Private IPFS Guide](https://docs.pinata.cloud/private-ipfs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
