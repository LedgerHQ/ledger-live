# Cursor CLI skill evals (Promptfoo)

Shared Promptfoo rig for evaluating agent skills via `cursor-agent`. Per-skill prompts and assertions live in `.agents/skills/<skill-name>/evals.json`.

## Prerequisites

- `cursor-agent` on your PATH (or set `config.binary` in `promptfooconfig.yaml`)
- `CURSOR_API_KEY` or `cursor-agent login`
- Node.js and pnpm

## Setup

```bash
cd .agents/evals
pnpm install --ignore-workspace
```

This directory is a **nested pnpm workspace** (see `pnpm-workspace.yaml` and `.npmrc`) so installs stay isolated from the monorepo root.

## Run a skill eval

```bash
./run.sh mvvm-architecture
```

Or from repo root:

```bash
EVAL_SUITE=$PWD/.agents/skills/mvvm-architecture/evals.json \
  pnpm --dir .agents/evals exec promptfoo eval -c ./promptfooconfig.yaml
```

## View results

```bash
pnpm view
```

## Add evals for another skill

1. Create `.agents/skills/<skill-name>/evals.json` with `{ "prompt", "vars", "expected": [...] }`.
2. Run `./run.sh <skill-name>`.

No changes to shared files under `.agents/evals/` are required.

## Skill discovery

When `EVAL_SUITE` points at `.agents/skills/<name>/evals.json`, `cursor_wrapper.ts`:

- Passes `--plugin-dir` for `.agents/skills` and `.claude/skills` when present
- Prepends a short instruction to read `.agents/skills/<name>/SKILL.md` before answering

The trace assertion checks that `mvvm-architecture/SKILL.md` appears in `metadata.filesRead` from the Cursor CLI NDJSON stream.
