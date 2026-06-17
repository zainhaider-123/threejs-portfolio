# AGENTS.md

## Project

Three.js portfolio site built with Astro 6 and Tailwind CSS 4. Purpose: showcase Three.js 3D skills and projects.

## Commands

- `pnpm dev` — dev server on `localhost:4321`
- `pnpm build` — production build to `dist/`
- `pnpm preview` — preview production build locally
  **Package manager is pnpm.** No npm or yarn.

## Stack Notes

- **Astro 6** with strict TypeScript (`astro/tsconfigs/strict`)
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin — no `tailwind.config.js`, no PostCSS config file. Import Tailwind directly in CSS with `@import "tailwindcss"`.
- **Node >=22.12.0** required
- `pnpm-workspace.yaml` only configures `allowBuilds` — this is not a monorepo

## Three.js Integration

When adding Three.js scenes:

- Astro is a server-rendered framework. Three.js runs in the browser only.
- Use `<script>` tags in `.astro` files for vanilla Three.js, or integrate via a UI framework component (React, etc.) with a `client:*` directive.
- Three.js code must not run at build time — guard with `import.meta.browser` or place in `<script>` / client-side lifecycle hooks.
- Prefer keeping 3D scene logic in `src/components/` or `src/scripts/` and importing into pages.

## Structure

```
src/pages/       — Astro file-based routing (entry points)
src/components/  — Astro / framework components (create as needed)
src/layouts/     — Shared page layouts (create as needed)
public/          — Static assets served at /
```

## Conventions

- No linter, formatter, or test runner configured yet. Add as the project grows.
- `.astro/` is auto-generated (gitignored) — never edit manually.
