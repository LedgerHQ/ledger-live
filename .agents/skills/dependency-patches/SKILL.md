---
name: dependency-patches
description: Read before creating or changing `patches/*.patch`, `pnpm.patchedDependencies`, or using `pnpm patch` to modify third-party dependency source.
---

# Dependency patches

A `pnpm` patch is a content fork of a third-party dependency. Do not choose one casually: prefer an upstream release, configuration, or application-side workaround. This policy applies to **new patches**; [existing patches require a migration/removal decision](https://ledgerhq.atlassian.net/browse/LIVE-38205) before being expanded or carried to a new version.

## Before creating a patch

1. Check the upstream issue tracker, pull requests, and releases for the fix. Use an available upstream release instead of a patch.
2. Assess whether the dependency is outdated, still needed, and has a maintained alternative. Prefer replacing an unmaintained or unnecessary dependency over carrying a patch.
3. Do not put Ledger product logic in a dependency. A small generic, opt-in hook may be patched only when it is suitable for upstreaming.
4. Use a local patch only when the equivalent upstream fix is open or merged but unreleased. Otherwise, a patch is an exception: a revert, an unmaintained dependency, or an urgent production/CI fix. Record the justification and the removal plan in the tracking ticket, and still open the upstream PR when one applies.

## Every patch requires

- A tech-debt backlog ticket linking the upstream PR/reference (when applicable), naming an owner, and stating the removal condition, such as “remove after upstream version `X.Y.Z`”.
- An adjacent comment in the patched file using that file's native comment syntax, with the upstream reference and removal condition. For formats without comments (for example JSON), put those details in the tracking ticket.
- Minimal, generic changes that can be removed cleanly. Never use a patch to inject undeclared dependencies; see [pnpm-resolution](../pnpm-resolution/SKILL.md).
