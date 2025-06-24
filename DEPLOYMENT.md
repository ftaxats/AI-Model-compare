# Vercel Deployment Guide

## Quick Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ftaxats/AI-Model-compare&env=OPENAI_API_KEY,ANTHROPIC_API_KEY,GOOGLE_AI_API_KEY)

## Manual Deployment Steps

### 1. Prepare Your Repository
- Fork or clone this repository to your GitHub account
- Ensure all files are committed and pushed

### 2. Deploy to Vercel
1. Visit [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your repository
4. Vercel will automatically detect the configuration from `vercel.json`

### 3. Configure Environment Variables
In your Vercel project dashboard, add these environment variables:

#### Required Variables
```
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
GOOGLE_AI_API_KEY=your-google-ai-key-here
```

#### Optional Variables (for enhanced web search)
```
GOOGLE_SEARCH_API_KEY=your-google-search-api-key
GOOGLE_SEARCH_ENGINE_ID=your-search-engine-id
```

### 4. Deploy
- Click "Deploy" and wait for the build to complete
- Your app will be available at `https://your-project-name.vercel.app`

## Getting API Keys

### OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign in and create a new secret key
3. Copy the key (starts with `sk-`)

### Anthropic API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an account and generate an API key
3. Copy the key (starts with `sk-ant-`)

### Google AI API Key
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy the key (starts with `AIza`)

### Google Custom Search (Optional)
1. Go to [developers.google.com/custom-search](https://developers.google.com/custom-search)
2. Create a Custom Search Engine
3. Get your API key and Search Engine ID

## Troubleshooting

### Build Errors
- Ensure all dependencies are in `package.json`
- Check that TypeScript types are correctly configured
- Verify environment variables are set

### API Errors
- Validate API keys are correct and active
- Check API quotas and billing status
- Ensure keys have proper permissions

### Performance Issues
- Monitor Vercel function logs
- Check for rate limiting on AI APIs
- Consider implementing request caching

## Features After Deployment

- Multi-AI model comparison
- Real-time web search integration
- Conversation history
- Dark mode support
- Mobile-responsive design
- API key management interface

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify API key configuration
3. Test individual API endpoints
4. Review network connectivity

Your Multi-AI Chat application will be ready to use immediately after deployment with proper API key configuration.