# TypeScript v7 (tsgo) Compatibility Study

## What is this?

[`typescript-go`](https://github.com/microsoft/typescript-go) is a Go-based rewrite of the TypeScript compiler that will ship as **TypeScript v7**. It provides a `tsgo` CLI binary as a drop-in replacement for `tsc`, with significant performance improvements (10x+ faster type-checking claimed by Microsoft).

## Goal

This branch replaces all `tsc` invocations with `tsgo` across the `ledger-live` monorepo to:
1. Verify compatibility — does the monorepo still compile with TS v7?
2. Measure performance — how much faster is type-checking?
3. Surface any breaking changes early, before TS v7 stable release.

## What changed

- All `tsc` calls in `package.json` scripts replaced with `tsgo` (~150 files)
- All `tsc` calls in `.github/` CI workflows replaced with `tsgo`
- Added `@typescript/typescript-go@nightly` as a root dev dependency
- Added `tsgo` root-level script
- Added `.github/workflows/tsgo-study.yml` — a dedicated CI workflow that runs `tsgo` with timing output

## CI Workflow

The `tsgo-study` workflow (`.github/workflows/tsgo-study.yml`) runs on:
- Manual dispatch (`workflow_dispatch`)
- Pushes to this branch

It produces:
- A step summary with `tsgo` version and timing
- An artifact with the full typecheck output

## How to run locally

```bash
pnpm add -w -D @typescript/typescript-go@nightly
pnpm tsgo --version
time pnpm tsgo --noEmit -p tsconfig.json
```

## Notes

- `tsgo` is pre-release / nightly — not for production use yet
- This is a study branch only; do not merge into main
- Results will vary as `typescript-go` matures
