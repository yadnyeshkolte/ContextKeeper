# ContextKeeper - Vercel Deployment (Deploy Branch)

This branch is configured for deployment to Vercel with both frontend and backend as serverless functions.

## 🚀 Quick Deploy to Vercel

### Prerequisites
1. **MongoDB Atlas Account** (Free tier available)
   - Create cluster at https://www.mongodb.com/cloud/atlas
   - Get connection string
   
2. **API Keys**:
   - GitHub Personal Access Token: https://github.com/settings/tokens
   - Hugging Face API Key: https://huggingface.co/settings/tokens
   - (Optional) Slack Bot Token
   - (Optional) Notion Integration Token

### Deployment Steps

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Set Environment Variables**:
   ```bash
   vercel env add MONGODB_URI
   vercel env add GITHUB_TOKEN
   vercel env add GITHUB_REPO
   vercel env add HUGGINGFACE_API_KEY
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## 📁 Project Structure

```
ContextKeeper/
├── api/                      # Serverless API functions
│   ├── _lib/                 # Shared utilities
│   │   ├── db.js            # MongoDB connection pooling
│   │   └── pythonRunner.js  # Python script executor
│   ├── agents/              # AI agent endpoints
│   │   ├── github.js
│   │   ├── slack.js
│   │   ├── notion.js
│   │   ├── summarize.js
│   │   ├── decide.js
│   │   └── status/[jobId].js
│   ├── config.js
│   ├── status.js
│   ├── branches.js
│   ├── query.js
│   ├── knowledge-graph.js
│   ├── sync-repo.js
│   ├── sync-data.js
│   └── check-updates.js
├── backend/                 # Python scripts (executed by API functions)
│   ├── scripts/
│   │   ├── github_collector.py
│   │   ├── rag_engine.py
│   │   ├── knowledge_graph_builder.py
│   │   ├── unified_summarizer.py
│   │   └── decision_engine.py
│   └── agents/
│       ├── base_agent.py
│       ├── github_agent.py
│       ├── slack_agent.py
│       └── notion_agent.py
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── utils/
│   │   │   └── api.ts       # Environment-aware API utility
│   │   ├── components/
│   │   └── App.tsx
│   └── dist/                # Built static files (created by Vercel)
├── vercel.json              # Vercel configuration
├── requirements.txt         # Python dependencies
└── package.json             # Root package.json for API dependencies
```

## 🔧 Configuration Files

### `vercel.json`
- Defines routing from frontend to API
- Sets function timeouts (60s for complex operations)
- Maps environment variables

### `requirements.txt`
Python dependencies for serverless functions:
- chromadb
- huggingface-hub
- PyGithub
- requests

### `api/_lib/db.js`
MongoDB connection pooling for efficient serverless operation.

### `frontend/src/utils/api.ts`
Automatically detects environment:
- **Production (Vercel)**: Uses relative API paths (`/api/*`)
- **Development**: Uses `http://localhost:3000` or `VITE_API_URL`

## 🔐 Environment Variables

### Required
- `MONGODB_URI` - MongoDB Atlas connection string
- `GITHUB_TOKEN` - GitHub Personal Access Token (scopes: repo, read:org)
- `GITHUB_REPO` - Default repository (e.g., `username/repo`)
- `HUGGINGFACE_API_KEY` - For AI/ML features

### Optional
- `SLACK_TOKEN` - Slack Bot Token
- `SLACK_CHANNELS` - Comma-separated channel names
- `NOTION_TOKEN` - Notion Integration Token

## 🧪 Testing Locally

1. **Install dependencies**:
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && pip install -r ../requirements.txt
   ```

2. **Set up environment variables**:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   # Edit .env files with your values
   ```

3. **Run with Vercel Dev  (recommended)**:
   ```bash
   vercel dev
   ```

   Or run services separately:
   ```bash
   # Terminal 1 - Backend
   cd backend && node src/server.js

   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

## ⚠️ Known Limitations

### Serverless Timeouts
- **Hobby Plan**: 10-second timeout
- **Pro Plan**: 60-second timeout
- Long-running Python scripts may timeout
- Solution: Optimize scripts or upgrade plan

### ChromaDB Persistence
- Serverless functions are stateless
- ChromaDB files don't persist between invocations
- Data must be recreated or fetched on each cold start
- For production: Migrate to managed vector DB (Pinecone, Weaviate)

### Python Execution
- Each API call spawns Python process
- Cold starts may be slow (~2-5 seconds)
- Warm invocations are faster

## 📊 Deployment Checklist

- [ ] MongoDB Atlas cluster created and connection string obtained
- [ ] All environment variables set in Vercel
- [ ] GitHub token has correct permissions
- [ ] Hugging Face API key is valid
- [ ] Deployed successfully (`vercel --prod`)
- [ ] Frontend loads correctly
- [ ] Repository selection works
- [ ] Data sync functionality tested
- [ ] Query/RAG functionality tested
- [ ] Knowledge graph displays
- [ ] AI agents functional (if keys configured)

## 🐛 Troubleshooting

### "Function execution timeout"
- Check Vercel function logs
- Optimize Python scripts
- Consider upgrading to Pro plan for 60s timeout

### "Module not found"
- Ensure `package.json` has all dependencies
- Verify `requirements.txt` is in root
- Redeploy with `vercel --force`

### "MongoDB connection failed"
- Verify MongoDB Atlas whitelist: 0.0.0.0/0
- Check connection string format
- Ensure database user permissions

### API returns 404
- Check `vercel.json` routing
- Verify API files are in `/api` directory
- Check function logs in Vercel dashboard

## 📝 Differences from Main Branch

This `deploy` branch contains deployment-specific changes:

1. **Added `/api` directory** with serverless functions
2. **Added `vercel.json`** for Vercel configuration
3. **Added root `package.json`** for API dependencies
4. **Created `api/_lib/` utilities** for shared code
5. **Updated frontend** to use environment-aware API utility
6. **Added `requirements.txt`** for Python dependencies
7. **Created `.vercelignore`** to exclude unnecessary files

Main branch (`develop`) is for local development with traditional Express backend.

## 🎯 For Demo Purposes

This deployment is optimized for demonstrating ContextKeeper to judges:

1. **Pre-sync data** before demo to avoid timeout during presentation
2. **Use caching** - knowledge graph has 5-minute cache
3. **Test end-to-end** before presenting
4. **Have backup** screenshots if live demo fails
5. **Document limitations** to set realistic expectations

## 📞 Support

For issues or questions about deployment:
- Check deployment guide: `.gemini/antigravity/brain/.../deployment_guide.md`
- Review Vercel logs: `vercel logs [url]`
- Check GitHub Issues: https://github.com/yadnyeshkolte/ContextKeeper/issues

---

**Happy Deploying! 🚀**
