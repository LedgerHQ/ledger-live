---
name: e2e-shell-permissions
description: Configures shell permissions for Playwright, Electron, Speculos, and dev server commands. Use when running playwright test, playwright install, pnpm e2e:desktop, pnpm build:lld:deps, pnpm desktop build:testing, or any command that launches Electron, a browser, or Speculos in the terminal.
---

# E2E Shell Permissions

Playwright launches Electron/browsers, Speculos spawns Docker containers, and both access the network and write to temp directories outside the workspace sandbox. Always use `required_permissions: ["all"]` for these commands — never run them in the default sandbox:

- `pnpm e2e:desktop test:playwright …`
- `pnpm desktop build:testing`
- `pnpm build:lld:deps`
- `playwright test --config=e2e/desktop/playwright.config.ts …`
- `playwright install …`
- Any command with `MOCK=0` (Speculos mode — launches Docker)
- Any command with `PWDEBUG=1` (debug mode — launches headed browser)

This avoids the fail → re-prompt → retry cycle that doubles the number of approval dialogs for the user.
