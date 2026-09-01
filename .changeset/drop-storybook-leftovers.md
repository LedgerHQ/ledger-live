---
"@ledgerhq/react-ui": patch
---

Drop the leftovers of the Storybook removal: the orphan `rsbuild.config.ts` and its now-unused dev dependencies (`@rsbuild/*`, `os-browserify`, `tty-browserify`, `util`), and the dead Playwright suite of `@ledgerhq/ui` which targeted the `examples/` folder deleted earlier.
