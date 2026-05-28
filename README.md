# BooleanOS

AI sourcing query copilot for recruiters and sourcers.

## Live URL

https://boolean-os-git-main-middlechildmzks-projects.vercel.app

## Current build

BooleanOS v2.3 Real AI Integration

Includes:

- Server-side `/api/analyze-role` route
- OpenAI structured extraction when `OPENAI_API_KEY` is configured
- Safe deterministic fallback parser when no API key is configured
- Memory-aware prompt context using local feedback
- AI source/status display in the UI
- AI strategy notes and memory-change notes
- Guided workflow bar
- Editable search criteria with suggestions
- Move terms to exclusions or filters/context
- Query Health
- Run First Recommendation
- Query scorecards for coverage, precision, noise, syntax, and platform fit
- Run All X-Ray
- Saved project reload
- Search session history
- Stronger HM memo
- Local learning and feedback memory
- SourcingOS export payload

## Vercel environment variables

Optional AI integration:

```env
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4.1-mini
```

If these are not set, the app still works using the local deterministic parser.

## Local development

```bash
npm install
npm run dev
```

## Vercel

This app is deployed from the repository root. Do not set a custom Root Directory in Vercel. Leave Root Directory blank.

Environment variables for first deploy:

```env
NEXT_PUBLIC_BETA_WAITLIST_MODE=true
NEXT_PUBLIC_STRIPE_ENABLED=false
```
