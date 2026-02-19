# Frontend — Next.js 16+ with Better Auth

## Tech Stack
- Next.js 16+ (App Router), TypeScript
- Better Auth (email+password)
- Tailwind CSS
- Package manager: npm

## Run
```bash
cd frontend
npm install
npm run dev
```

## Key Files
- `lib/auth.ts` — Better Auth client config
- `lib/api.ts` — API client with Bearer token
- `app/page.tsx` — Login/Signup page
- `app/dashboard/page.tsx` — Task manager
- `components/providers/AuthProvider.tsx` — Auth context

## Rules
- All API calls go through lib/api.ts (auto-attaches Bearer token)
- Unauthenticated users redirected to /
- Never store secrets in client code (use .env)
