# Toronto Parkinator

Mobile-first Next.js app to find nearby Green P parking in downtown Toronto.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production server locally

## Environment

Copy `.env.local.example` to `.env.local` and fill in keys as needed:

```bash
cp .env.local.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_TOMTOM_API_KEY` | Recommended | TomTom Maps Web SDK key for the interactive map ([TomTom Developer Portal](https://developer.tomtom.com/)). Without it, the app shows a CSS placeholder map. |
| `GREENP_API_KEY` | Optional | Green P API key (defaults to bundled dev key if unset) |

Example `.env.local`:

```
NEXT_PUBLIC_TOMTOM_API_KEY=your_tomtom_key_here
GREENP_API_KEY=your_key_here
```

## Deploy (Vercel)

1. Push to GitHub
2. Import project in Vercel (root: `toronto-parkinator`)
3. Set `NEXT_PUBLIC_TOMTOM_API_KEY` and `GREENP_API_KEY` if needed
4. Deploy

## Notes

- Green P may return an Incapsula WAF challenge from some networks (HTML instead of JSON). The app falls back to sample downtown lots for local development; server-side fetch from Vercel often works in production.
