# BooleanOS

AI sourcing query copilot for recruiters and sourcers.

## Live URL

https://boolean-os-git-main-middlechildmzks-projects.vercel.app

## Current build

BooleanOS v2.2 Live UX + Workflow Hardening

Includes:

- Guided workflow bar
- Stronger deterministic role analyzer
- Editable search criteria with suggestions
- Move terms to exclusions or filters/context
- Query Health
- Run First Recommendation
- More query variants
- Query scorecards for coverage, precision, noise, syntax, and platform fit
- Run All X-Ray
- Copy Google URL
- Saved project reload
- Search session history
- Stronger HM memo
- Local learning and feedback memory
- SourcingOS export payload

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
