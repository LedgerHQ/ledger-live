# Ledger Live Desktop Tests

This folder contains app-local Playwright fixtures, page objects, component
tests, mocks, and specs for Ledger Live Desktop.

For the maintained Desktop E2E environment, Speculos setup, and full run
commands, start with [../../../e2e/desktop/README.md](../../../e2e/desktop/README.md).
For adding or updating E2E scenarios, read
[../../../e2e/desktop/docs/add-or-update-e2e.md](../../../e2e/desktop/docs/add-or-update-e2e.md).

## Structure

| Path                   | Purpose                                        |
| ---------------------- | ---------------------------------------------- |
| `fixtures`             | Playwright test fixtures and app launch setup  |
| `page`                 | Page objects with reusable UI actions          |
| `models`               | Test model helpers                             |
| `specs`                | Test scenarios                                 |
| `mocks` and `handlers` | Local mock data and MSW handlers               |
| `utils`                | Test utilities, setup, teardown, and reporters |

## Run

Run commands from the repository root.

```bash
pnpm desktop build:testing
pnpm desktop test:playwright:setup
pnpm desktop test:playwright
pnpm desktop test:playwright specs/<folder>/<file>.spec.ts
pnpm desktop test:playwright --grep @onboarding
```

Update snapshots only when visual changes are intentional:

```bash
pnpm desktop test:playwright:update-snapshots apps/ledger-live-desktop/tests/specs/<folder>/<file>.spec.ts
```

Use the recorder sparingly; recorded tests should be refactored into page
objects before review:

```bash
pnpm desktop test:playwright:recorder
```

## Test Authoring

- Prefer `data-testid` for unique elements.
- Keep page objects in `page/` or `models/` focused on actions and locators.
- Do not put assertions in page objects; assert from specs.
- Use visual comparison only when layout-level verification is the intent.
- Avoid duplicate screenshots of the same screen.
- Run new or changed tests multiple times before relying on them.

Example page-object pattern:

```ts
import { Locator, Page } from "@playwright/test";

export class OnboardingPage {
  readonly getStartedButton: Locator;

  constructor(readonly page: Page) {
    this.getStartedButton = page.getByTestId("onboarding-get-started-button");
  }

  async getStarted() {
    await this.getStartedButton.click();
  }
}
```

## Debug

```bash
PWDEBUG=1 pnpm desktop test:playwright
DEV_TOOLS=1 pnpm desktop test:playwright
DEBUG=pw:api pnpm desktop test:playwright
```

Useful external references:

- [Playwright assertions](https://playwright.dev/docs/test-assertions)
- [Page object models](https://playwright.dev/docs/test-pom)
- [Visual comparisons](https://playwright.dev/docs/test-snapshots)
