# Contributing to CodeSync

Thanks for wanting to help. This project follows a `main` / `develop` split, which
is the industry-standard way to keep a deployed app stable while accepting
outside contributions:

- **`main`** — always reflects what's live in production (Vercel + Render
  deploy from here). Nobody opens PRs against `main` directly.
- **`develop`** — the integration branch. All feature/fix work merges here
  first. Periodically, `develop` gets merged into `main` for a release.

## Workflow

1. **Find or open an issue.** Look for the [`good first issue`](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
   label if you're new to the repo.
2. **Comment on the issue** to say you're picking it up, so two people don't
   duplicate work.
3. **Branch off `develop`** (not `main`):

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/12-add-theme-toggle   # or fix/12-...
   ```

   Branch naming: `feature/<issue-number>-short-description` for new
   functionality, `fix/<issue-number>-short-description` for bug fixes.

4. **Make your change.** Keep PRs focused — one issue per PR.
5. **Run checks locally before pushing** (same checks CI runs):

   ```bash
   cd client   # or server
   npm run lint
   npm run build
   ```

6. **Open a PR targeting `develop`**, not `main`. Fill out the PR template —
   it asks you to link the issue and confirm the checklist above.
7. **CI must pass** (lint, typecheck, build, CodeQL) before a maintainer will
   review or merge. An AI reviewer (CodeRabbit) will also leave automated
   review comments — treat them as a first pass, not a blocker by itself.

## Code style

- TypeScript everywhere, strict mode. No `any` — narrow with `unknown` and
  type guards instead.
- Match the existing component patterns in `client/src/components/ui/` rather
  than introducing a new styling approach.
- No secrets, API keys, or `.env` files in commits — ever.

## Local setup

See the [README](./README.md#-local-development) for getting both `client`
and `server` running locally.

## Questions

Open a [discussion or issue](../../issues) — no question is too small.
