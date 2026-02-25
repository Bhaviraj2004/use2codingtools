# use2codingtools

A fast, privacy-first developer toolkit. 20+ tools, 100% client-side, zero server calls.

## Stack

- Next.js 14+ (App Router)
- Tailwind CSS + TypeScript
- Web Crypto API

## Setup

```bash
npm install
npm install bcryptjs
npm install --save-dev @types/bcryptjs
npm run dev
```

## Tools

**Data & JSON** — JSON Formatter, JSON→YAML, JSON→CSV, JSON Diff

**Security** — Base64, Password Generator, Hash Generator, bcrypt, HMAC, Random Token, UUID

**Date & Time** — Timestamp Converter, Timezone Converter, Cron Generator, Age Calculator

**Dev Utils** — Regex Tester, Case Converter, Slug Generator, Lorem Ipsum, Markdown Preview

## Adding a Tool

Create `app/tools/your-tool/page.tsx`, add `"use client"` at top, follow the existing dark theme.

## License

MIT