# InsightHire backend

## Setup

1. Install the backend dependencies:

   ```bash
   npm install
   ```

2. Set `MONGODB_URI` to the MongoDB connection string for the InsightHire
   database. For local development, use `.env.example` as a reference and set
   the variable in your shell; do not commit credentials.

   In PowerShell:

   ```powershell
   $env:MONGODB_URI = "your-mongodb-connection-string"
   ```

3. Start the API:

   ```bash
   npm run dev
   ```

The API listens on port `8000` by default. Configure `MONGODB_URI` as an
environment variable in any hosting platform that runs this backend.
