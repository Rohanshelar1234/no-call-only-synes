# SceneSync Deployment Guide

## Architecture
- **Backend**: Node.js + Socket.IO deployed on Render
- **Frontend**: Static HTML/CSS/JS deployed on Vercel

## Backend Deployment (Render)

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add deployment structure"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to https://render.com
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `backend` folder as root directory
   - Use these settings:
     - **Name**: scenesync-backend
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free
   - Click "Create Web Service"

3. **Get your backend URL** (e.g., `https://scenesync-backend.onrender.com`)

## Frontend Deployment (Vercel)

1. **Update Backend URL**
   - Open `frontend/app.js`
   - Replace `https://your-backend-url.onrender.com` with your actual Render URL

2. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up/login with GitHub
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the `frontend` folder as root directory
   - Framework Preset: "Other"
   - Click "Deploy"

3. **Get your frontend URL** (e.g., `https://scenesync-frontend.vercel.app`)

## Final Steps

1. **Test your deployed application**
   - Visit your Vercel frontend URL
   - Create/join rooms and test all features

2. **Update README** with your live URLs

## Environment Variables

No environment variables needed for basic deployment. Render automatically sets PORT.

## Troubleshooting

- **CORS Issues**: Backend already configured with CORS for all origins
- **Socket Connection**: Ensure frontend URL matches your deployed backend URL
- **Build Failures**: Check that all dependencies are in backend/package.json
