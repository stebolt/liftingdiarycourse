# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚠️ CRITICAL: Always Consult Documentation First

**BEFORE generating ANY code, ALWAYS check the relevant documentation files in the `docs/` directory.**

### Documentation Files

- **`docs/ui.md`**: UI coding standards (shadcn/ui components, date formatting, styling)

### Required Workflow

1. **Read the relevant docs file** for the feature you're implementing
2. **Follow the standards** outlined in the documentation
3. **Generate code** that adheres to the documented standards

### Examples

- **Creating UI components?** → Read `docs/ui.md` first
  - Use ONLY shadcn/ui components
  - Format dates with date-fns: `format(date, 'do MMM yyyy')`
  - Use Lucide icons
  - Use semantic Tailwind colors

**Failure to consult documentation will result in code that violates project standards.**

## Project Overview

This is a Next.js 16.1.1 application using React 19, TypeScript, and Tailwind CSS 4. The project appears to be for a lifting diary application (based on the project name "liftingdiarycourse").

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

## Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3
- **TypeScript**: 5.x with strict mode enabled
- **Styling**: Tailwind CSS 4 with PostCSS
- **UI Components**: shadcn/ui ONLY (see `docs/ui.md`)
- **Icons**: Lucide React
- **Date Formatting**: date-fns (format: `'do MMM yyyy'`)
- **Fonts**: Geist and Geist Mono (from next/font/google)
- **Authentication**: Clerk (latest version via @clerk/nextjs)
- **Database**: Drizzle ORM with Neon PostgreSQL
- **Linting**: ESLint with Next.js config

## Project Structure

- **`docs/`**: ⚠️ **PROJECT STANDARDS AND GUIDELINES** (ALWAYS READ FIRST)
  - `ui.md`: UI coding standards (shadcn/ui only, date formatting, styling)
- **`app/`**: Next.js App Router directory
  - `layout.tsx`: Root layout with font configuration and metadata
  - `page.tsx`: Home page component
  - `globals.css`: Global styles with Tailwind import and CSS variables for theming
- **`components/`**: Component directory
  - `ui/`: shadcn/ui components ONLY (auto-generated, no custom components)
- **`lib/`**: Utility functions
  - `utils.ts`: cn() helper for class merging
  - `types/`: TypeScript type definitions
  - `actions/`: Server actions
- **`src/db/`**: Database layer
  - `schema.ts`: Drizzle ORM schema definitions
  - `index.ts`: Database connection
  - `queries.ts`: Database query functions
- **`public/`**: Static assets (SVG files)
- **Configuration files**:
  - `next.config.ts`: Next.js configuration (currently minimal)
  - `tsconfig.json`: TypeScript configuration with path alias `@/*` pointing to root
  - `eslint.config.mjs`: ESLint configuration with Next.js presets
  - `postcss.config.mjs`: PostCSS configuration for Tailwind CSS 4

## Architecture Notes

### Styling System

The project uses Tailwind CSS 4 with a custom theming approach:
- CSS variables defined in `globals.css` for `--background` and `--foreground`
- Uses `@theme inline` directive to map variables to Tailwind tokens
- Font variables (`--font-geist-sans`, `--font-geist-mono`) are injected via Next.js font configuration
- Dark mode support via `prefers-color-scheme` media query

### TypeScript Configuration

- Path alias `@/*` maps to the root directory (e.g., `@/app/components`)
- Target is ES2017
- Strict mode is enabled
- Module resolution uses `bundler` strategy (Next.js optimized)

### Font Loading

Fonts are loaded via `next/font/google` in `app/layout.tsx`:
- Geist Sans and Geist Mono fonts
- CSS variables injected into body className
- Optimized loading with automatic font optimization

### ESLint Setup

- Uses Next.js recommended configurations: `core-web-vitals` and `typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

## Authentication with Clerk

The application uses Clerk for authentication and user management.

### Setup

1. **Environment Variables**: Create `.env.local` with your Clerk keys:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_publishable_key
   CLERK_SECRET_KEY=your_secret_key
   ```
   Get your keys from: https://dashboard.clerk.com/last-active?path=api-keys

2. **Middleware**: `middleware.ts` at the root uses `clerkMiddleware()` from `@clerk/nextjs/server`
   - Protects all routes except Next.js internals and static files
   - Always runs for API routes

3. **Layout Integration**: `app/layout.tsx` wraps the app with `<ClerkProvider>`
   - Header contains sign-in/sign-up buttons for unauthenticated users
   - Shows `<UserButton>` for authenticated users

### Key Components

- `<SignedIn>`: Only renders content for authenticated users
- `<SignedOut>`: Only renders content for unauthenticated users
- `<SignInButton>`: Triggers sign-in modal
- `<SignUpButton>`: Triggers sign-up modal
- `<UserButton>`: Shows user profile menu

### Server-Side Authentication

For server components or API routes, use:
```typescript
import { auth } from "@clerk/nextjs/server";

export default async function Page() {
  const { userId } = await auth();
  // Use userId to fetch user-specific data
}
```

### Important Notes

- Always use `clerkMiddleware()` (not the deprecated `authMiddleware()`)
- Import auth helpers from `@clerk/nextjs/server` for server-side code
- Import UI components from `@clerk/nextjs` for client components
- `.env.local` is git-ignored and must be configured locally

## Database Schema

The application uses Drizzle ORM with Neon PostgreSQL. Schema is defined in `src/db/schema.ts`.

### Tables

1. **exercises** - Master list of exercises (shared across users)
2. **workouts** - User workout sessions (userId, date, name, durationMinutes, notes)
3. **workout_exercises** - Junction table linking workouts to exercises
4. **sets** - Individual sets (weight, reps, RPE, isBodyweight)

All database queries should be placed in `src/db/queries.ts`.

## Code Generation Checklist

Before generating any code, ensure you:

- [ ] **Read the relevant documentation** in `docs/` directory
- [ ] **Follow UI standards** from `docs/ui.md`:
  - [ ] Use ONLY shadcn/ui components
  - [ ] Format dates with date-fns: `format(date, 'do MMM yyyy')`
  - [ ] Use Lucide icons
  - [ ] Use semantic Tailwind colors
- [ ] **Follow TypeScript strict mode** conventions
- [ ] **Use path aliases** (`@/*`) for imports
- [ ] **Check existing patterns** in the codebase before creating new patterns

## ⚠️ Final Reminder

**ALWAYS consult `docs/` directory before writing code. Standards are documented for a reason.**
