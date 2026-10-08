# Code Trail

Workspace for a self-hosted code knowledge base. The implemented app is the Reading Lab: a local React experiment comparing file-grouped code with a dependency/data-flow graph. Both views use the same evidence.

## Layout

- `apps/dashboard/knowledge`: implemented React/Vite reading lab.
- `apps/api/knowledge`: placeholder for HTTP, MCP, webhook, and Slack endpoints.
- `apps/workers/ingestor`: placeholder for Python CocoIndex/Cognee processing.
- `packages/core`: placeholder for framework-independent rules.
- `packages/database`: placeholder for PostgreSQL ownership.
- `packages/shared`: placeholder for versioned transport contracts.
- `infra/compose` and `infra/images`: deployment placeholders.
- `tooling`: architecture/integration check placeholder.
- `docs`: study protocol and workspace conventions.

Only the dashboard has a package manifest and executable tasks. Placeholder READMEs describe ownership and next steps.

## Run

Use Node.js 26.11.1 and pnpm 12.10.1, pinned in `mise.toml`.

```sh
mise install
mise run bootstrap
mise run dev
```

With those tools already installed:

```sh
pnpm bootstrap
pnpm dev
```

Open the local URL printed by Vite. Use a consistent desktop viewport for study sessions.

```sh
pnpm check
pnpm test
pnpm build
pnpm preview
```

Package scripts own local behavior. Turbo coordinates workspace tasks. Oxlint and Prettier run centrally. mise exposes the same tasks; Compose topology will follow when services exist.

Focused work:

```sh
pnpm --filter @codetrail/dashboard dev
pnpm --filter @codetrail/dashboard test
```

Dashboard builds land in `apps/dashboard/knowledge/dist`. Workspace boundaries: [architecture](docs/architecture.md).

## Included experience

- Facilitator selects one of four counterbalanced participant assignments.
- A separate, untimed practice fixture supports both formats.
- Two 12-minute tasks: dependencies, input-to-output behavior, and change review.
- Fixed graph layout with pan, zoom, fit-view, typed edge labels, and highlighted additions/deletions.
- Identical code renderer and relationship data for the linear presentation.
- Draft persistence in localStorage, automatic deadline submission, and reload/tab-hide interruption records.
- Post-task feedback and session JSON export, including assignments, answers, elapsed time, timeout flags, and interruption timestamps.
- Self-hosted fonts and local fixtures; the app does not need an external API.

This is **rehearsal-ready**, not a completed empirical study. Examples A and B are original synthetic fixtures, intentionally labeled as demos. They share similar defect structures and must not be used to support the research hypothesis. A real study repository and participants have not been selected.

## Prepare actual pilot examples

See [the experiment protocol](docs/experiment.md). Select historical changes through read-only repository access. Never execute or modify the studied application.

Paths below are relative to `apps/dashboard/knowledge`.

1. Replace the examples in `src/fixtures.ts` with two audited historical changes. Preserve the A/B keys. Populate source revision, relevant blocks, exact diff lines, line references, scenario, and explicitly typed relationships.
2. Keep one shared fixture per example: do not maintain separate source content for graph and linear presentations.
3. Audit graph positions, readable code, edge labels, and information parity. Do not add explanatory hints to either view.
4. Keep private answer keys, later fixes, and regression-test evidence **outside `src/`, `public/`, and the production bundle**. A client-only app cannot conceal bundled data from participants.
5. Update the fixture version and session mode in `src/study.ts`, the demo labels in `src/App.tsx`, and saved-session compatibility validation together. Do not mix records from different fixture versions.
6. Rehearse with the separate practice example, verify export and timeouts, and freeze the app before sessions.

## Results and storage

Sessions are stored under `codetrail.study.v1` in the current browser/origin. Do not change the host or port mid-session. Time uses an absolute deadline, so reloading or backgrounding does not pause or restart it. Interrupted timings need manual review. Changing the system clock during a task invalidates its timing.

Download JSON before clearing the session or starting a new participant. Exports are saved by your browser; no server receives answers. Score responses separately against the private rubric. Submission time is not proof of correctness and must be interpreted alongside the scores.

## Source map

Relative to `apps/dashboard/knowledge`:

- `src/fixtures.ts`: shared source and relationship fixtures.
- `src/CodeView.tsx`: common code renderer, linear presentation, and React Flow nodes/edges.
- `src/study.ts`: assignments, session records, deadlines, and persistence loading.
- `src/App.tsx`: setup, practice, timed tasks, feedback, and export.
- `src/study.test.ts`: assignment balance, deadline integrity, interruptions, and fixture references.

There is no automatic code parser or runtime tracing in this pilot. Relationships are manually curated from source evidence; a graph edge does not establish execution order.
