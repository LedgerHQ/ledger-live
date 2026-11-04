---
name: configuration
description: |
  Pick the home for a configuration value — environment variable, backend URL, partner key,
  public token, per-environment constant, build secret — and take an existing one out of
  `@shared/env` / `@ledgerhq/live-env` (`getEnv`, `setEnv`, `useEnv`, `injectDefinitions`).
  Read before adding or changing any env var, `.env` entry or `getEnv` call site.
---

# Configuration

Read [/docs/configuration.md](../../../docs/configuration.md) — the canonical guide. It opens with
a **Pattern → home** table mapping each kind of value to exactly one home, and has one section per
home with this repo's mechanics and worked examples. Jump to the row that matches instead of
paraphrasing the doc in chat.

Two rules to apply without reading further:

- **`@shared/env` and `@ledgerhq/live-env` are deprecated**: no new definition, no new call site,
  including in tests. Migrating a variable means deleting its definition in the same PR.
- **A value in an app's `.env` file ships inside the artifact.** Public configuration only; a real
  build secret stays in the workflow step and never reaches app code.
