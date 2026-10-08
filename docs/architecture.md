# Workspace conventions

Based on frad3ail's app/package boundaries. Oxlint remains the linter.

## Ownership

- `apps/*/*`: deployable surfaces. Startup and dependency composition live here.
- `packages/core`: business capabilities independent of transports and storage.
- `packages/database`: schema, migrations, queries, and core repository implementations.
- `packages/shared`: wire contracts; no business rules.
- `infra`: service topology and images.
- `tooling`: checks spanning the workspace.

README-only placeholders are not executable packages. Add manifests and scripts with real implementation.

## Capability structure

Group core code by responsibility, then file role:

- `types.ts`: business inputs/results.
- `service.ts`: rules and coordination through injected capabilities.
- `repository.ts`: data-access interface.
- `index.ts`: explicit public exports.

Create only needed files. No global dumping grounds for services or utilities.

Frontend composition belongs in `src/app`. Feature code belongs in `src/features`; clients/adapters in `src/infrastructure`. Existing reading-lab source stays intact during workspace migration.

## Imports

- Core does not import React, HTTP, ORM, or provider SDKs.
- Applications import published package entry points, never another package's source path.
- Use `workspace:*` for internal JavaScript package dependencies.
- Cross-capability imports use explicit public interfaces.
- Python worker uses versioned wire contracts, not TypeScript imports.
- API owns authorization, job transitions, and publication ordering. Ingestor owns extraction/computation.

Import checks arrive when these boundaries have real consumers.

## Tasks

- Root `bootstrap`: frozen pnpm install.
- Root `dev`, `build`, `test`, `typecheck`: Turbo package tasks.
- Root `lint`: shared Oxlint config.
- Root `format`/`format:check`: shared Prettier config.
- Root `check`: formatting, lint, and types. Run `test` and `build` separately.
- `mise.toml`: Node/pnpm selection and developer task entry point.

Builds cache `dist`; dev stays persistent and uncached. Typecheck always runs because incremental compiler state is local. Migrations and external integration tasks must be uncached when added.

Python tools and lockfiles arrive with the ingestor. Use real lint/typecheck/test tasks rather than successful stubs.
