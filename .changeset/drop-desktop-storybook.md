---
"ledger-live-desktop": patch
"@ledgerhq/react-ui": patch
---

Remove Storybook from the desktop app: drop the `.storybook` config, the `rsbuild.storybook.config.js` builder, every `*.stories.*` file and the Storybook-only dependencies (`storybook`, `@storybook/*`, `storybook-react-rsbuild`, `@rsbuild/*`, `@vitest/mocker`, `events`). The `STORYBOOK_ENV` branches around `electron` access are gone, so `clipboard` and `shell` are now imported directly, and the shared Jest `electron` mock exposes `clipboard`. The now-dead `*.stories.tsx` exclusions in the repo Sonar and `@ledgerhq/react-ui` build configs are removed too.
