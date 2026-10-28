---
name: cleanup
description: "Manual entry point: format and lint the current changes with the validate-changes skill. Use when the user types /cleanup."
disable-model-invocation: true
---

# Cleanup

Run the [Format](../validate-changes/SKILL.md#1-format) and [Lint](../validate-changes/SKILL.md#2-lint)
steps of the [`validate-changes`](../validate-changes/SKILL.md) skill on the current changes, after
setting `BASE` as its introduction shows, then report them as that skill describes.
