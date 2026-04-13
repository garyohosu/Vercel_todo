# Vercel Todo

## Local

1. Copy `.env.example` to `.env.local`
2. Set `DATABASE_URL` to your Neon connection string
3. Run `npm install`
4. Run `npm run db:apply`
5. Run `npm run dev`

## Vercel

1. Add `DATABASE_URL` to the Vercel project environment variables
2. Deploy with `vercel` or connect the repo to Vercel
3. Apply the schema once against Neon before first use

## Current scope

- list todos
- create todo
- get one todo
- update todo
- delete todo
- edit page
