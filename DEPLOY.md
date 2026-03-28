# Casual Deploy Guide

This project is split into:
- Frontend: Vite + React (root)
- Backend: Express + Prisma (server)

## 1) Deploy Backend (Render/Railway)

1. Create a PostgreSQL database.
2. Deploy the server folder as a Node service:
   - Root directory: `server`
   - Build command: `npm install && npm run build && npx prisma generate && npx prisma migrate deploy`
   - Start command: `npm start`
3. Set server environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT` (optional, platform usually injects it)
   - `CORS_ORIGIN` = your frontend URL(s), comma-separated if more than one
   - `STRIPE_SECRET_KEY` (if payments enabled)
   - `STRIPE_WEBHOOK_SECRET` (if webhooks enabled)
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` (if SMS enabled)
   - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` (if email enabled)
4. Confirm backend health endpoint:
   - `https://your-backend-domain.com/health`

## 2) Deploy Frontend (Vercel/Netlify)

1. Deploy the root folder as a static site:
   - Build command: `npm run build`
   - Output directory: `dist`
2. Set frontend environment variables:
   - `VITE_API_URL=https://your-backend-domain.com/api`
   - `VITE_SOCKET_URL=https://your-backend-domain.com`
   - `GEMINI_API_KEY=...`
3. Redeploy after setting variables.

## 3) Quick Verification

1. Open frontend URL.
2. Register/login and verify API calls work.
3. Check chat/notifications to verify Socket.IO.
4. If requests are blocked, update `CORS_ORIGIN` on backend and redeploy.

## 4) Local-to-Prod Notes

- Frontend no longer hardcodes localhost URLs.
- Backend now supports multiple CORS origins via comma-separated `CORS_ORIGIN`.
- If uploads are required in production, attach persistent disk/storage for `/uploads`.
