# Micro SaaS Deployment Guide

This guide covers deploying the AltTextAI micro SaaS application with real-time AI streaming, file uploads, and multi-tenant architecture.

## 🚀 Architecture Overview

```
Frontend (React + Vite)
├── Real-time AI Chat
├── File Upload with Progress
├── Streaming Responses
└── SaaS Dashboard

Backend (Node.js/Next.js)
├── API Routes (/api/chat, /api/upload, /api/performance)
├── Database (MySQL/PostgreSQL)
├── File Storage (S3/Firebase)
└── Authentication (JWT/NextAuth)

Infrastructure
├── Vercel/Netlify (Frontend)
├── Railway/Render (Backend)
├── PlanetScale/Supabase (Database)
└── Cloudflare R2/AWS S3 (File Storage)
```

## 📦 Prerequisites

- Node.js 18+
- npm or yarn
- Database (MySQL/PostgreSQL)
- Cloud storage account (S3, Firebase, etc.)
- OpenAI API key

## 🔧 Environment Setup

### 1. Environment Variables

Create `.env.local` for development:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-proj-your-api-key-here
OPENAI_API_URL=https://api.openai.com/v1

# Database Configuration
DATABASE_URL=mysql://user:password@localhost:3306/alttextai
# or
DATABASE_URL=postgresql://user:password@localhost:5432/alttextai

# File Storage
S3_ACCESS_KEY=your-s3-access-key
S3_SECRET_KEY=your-s3-secret-key
S3_BUCKET=your-bucket-name
S3_REGION=us-east-1

# Authentication
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# API Configuration
API_BASE_URL=http://localhost:3000/api
CORS_ORIGIN=http://localhost:3000

# SaaS Configuration
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
```

### 2. Database Setup

#### MySQL Setup

```sql
-- Create database
CREATE DATABASE alttextai CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user
CREATE USER 'alttextai_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON alttextai.* TO 'alttextai_user'@'localhost';
FLUSH PRIVILEGES;
```

#### PostgreSQL Setup

```sql
-- Create database
CREATE DATABASE alttextai;

-- Create user
CREATE USER alttextai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE alttextai TO alttextai_user;
```

### 3. Database Migration

```bash
# Install Prisma (if using)
npm install prisma @prisma/client

# Initialize Prisma
npx prisma init

# Generate client
npx prisma generate

# Run migrations
npx prisma db push
```

## 🏗️ Backend Setup

### 1. Next.js API Routes

Create `pages/api/` directory structure:

```
pages/api/
├── chat.js          # Real-time AI streaming
├── upload.js        # File upload handling
├── performance.js   # Analytics and metrics
├── auth/
│   ├── login.js
│   └── register.js
└── webhooks/
    └── stripe.js
```

### 2. Database Connection

```javascript
// lib/database.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

### 3. File Upload Service

```javascript
// lib/upload.js
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.S3_ACCESS_KEY,
  secretAccessKey: process.env.S3_SECRET_KEY,
  region: process.env.S3_REGION
});

export async function uploadToS3(file, userId) {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: `uploads/${userId}/${Date.now()}-${file.name}`,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'public-read'
  };

  const result = await s3.upload(params).promise();
  return result.Location;
}
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended)

#### Frontend Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add DATABASE_URL
vercel env add S3_ACCESS_KEY
vercel env add S3_SECRET_KEY
```

#### Backend API Routes

Create `vercel.json`:

```json
{
  "functions": {
    "pages/api/chat.js": {
      "maxDuration": 30
    },
    "pages/api/upload.js": {
      "maxDuration": 60
    }
  },
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "DATABASE_URL": "@database-url"
  }
}
```

### Option 2: Railway

#### Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set OPENAI_API_KEY=your-key
railway variables set DATABASE_URL=your-db-url
```

### Option 3: Render

#### Deploy to Render

1. Connect GitHub repository
2. Set build command: `npm run build`
3. Set start command: `npm start`
4. Add environment variables in dashboard

## 🗄️ Database Deployment

### Option 1: PlanetScale (MySQL)

```bash
# Install PlanetScale CLI
npm i -g pscale

# Login and create database
pscale login
pscale database create alttextai
pscale branch create alttextai main

# Get connection string
pscale connect alttextai main
```

### Option 2: Supabase (PostgreSQL)

1. Create account at supabase.com
2. Create new project
3. Get connection string from Settings > Database
4. Run migrations:

```bash
# Install Supabase CLI
npm i -g supabase

# Link project
supabase link --project-ref your-project-ref

# Push schema
supabase db push
```

## 📁 File Storage Setup

### Option 1: AWS S3

```bash
# Create S3 bucket
aws s3 mb s3://your-alttextai-bucket

# Configure CORS
aws s3api put-bucket-cors --bucket your-alttextai-bucket --cors-configuration file://cors.json
```

`cors.json`:
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.com"],
      "AllowedMethods": ["GET", "POST", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### Option 2: Cloudflare R2

1. Create R2 bucket in Cloudflare dashboard
2. Generate API tokens
3. Configure CORS in dashboard

### Option 3: Firebase Storage

```bash
# Install Firebase CLI
npm i -g firebase-tools

# Initialize Firebase
firebase init storage

# Deploy rules
firebase deploy --only storage
```

## 🔐 Authentication Setup

### NextAuth.js Configuration

```javascript
// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import prisma from '../../../lib/database';
import bcrypt from 'bcryptjs';

export default NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (user && await bcrypt.compare(credentials.password, user.password_hash)) {
          return user;
        }
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async session({ session, token }) {
      session.user.id = token.sub;
      return session;
    }
  }
});
```

## 📊 Monitoring & Analytics

### 1. Error Tracking

```bash
# Install Sentry
npm install @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard -i nextjs
```

### 2. Performance Monitoring

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# Add to _app.js
import { Analytics } from '@vercel/analytics/react';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <Analytics />
    </>
  );
}
```

### 3. Database Monitoring

```bash
# Install Prisma Studio for development
npx prisma studio

# For production monitoring
npm install @prisma/client
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] File storage configured
- [ ] Authentication working
- [ ] API routes deployed
- [ ] CORS configured
- [ ] Rate limiting implemented
- [ ] Error tracking setup
- [ ] Monitoring configured
- [ ] SSL certificates installed
- [ ] Domain configured
- [ ] Backup strategy in place

## 🔧 Troubleshooting

### Common Issues

1. **CORS Errors**
   ```javascript
   // Add to API routes
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   ```

2. **Database Connection Issues**
   ```bash
   # Test connection
   npx prisma db pull
   npx prisma generate
   ```

3. **File Upload Failures**
   ```javascript
   // Check file size limits
   const maxSize = 20 * 1024 * 1024; // 20MB
   if (file.size > maxSize) {
     return res.status(413).json({ error: 'File too large' });
   }
   ```

4. **Streaming Issues**
   ```javascript
   // Ensure proper headers for streaming
   res.setHeader('Content-Type', 'text/event-stream');
   res.setHeader('Cache-Control', 'no-cache');
   res.setHeader('Connection', 'keep-alive');
   ```

## 📈 Scaling Considerations

- **Database**: Use connection pooling
- **File Storage**: Implement CDN
- **API**: Add rate limiting and caching
- **Monitoring**: Set up alerts for errors and performance
- **Backup**: Regular database and file backups

## 🔒 Security Best Practices

- Use environment variables for secrets
- Implement rate limiting
- Validate file uploads
- Use HTTPS everywhere
- Regular security updates
- Monitor for suspicious activity
- Implement proper authentication
- Use prepared statements for database queries





