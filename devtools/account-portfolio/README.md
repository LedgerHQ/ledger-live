# @devtools/account-portfolio

An API tester for the Portfolio service (`@domain/api-account-portfolio`): **Portfolio** (create, register, remove, add addresses, get) and **Read** (balance, balance history, updates). **Results** shows the last call and **History** lists the calls of the session. Each call is a real request. The tool shows the exact request sent, the HTTP status, a plain-language reading of a failure, a summary of the response and the raw JSON.

Built with Lumen (`@ledgerhq/lumen-ui-react`), web only.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)); all other `@devtools/*` imports are forbidden. Its props come from `useAccountPortfolioToolProps` in `@devtools/bindings`.

In development the renderer reaches the service through the rspack dev server proxy, because the service sends no CORS headers. See `apps/ledger-live-desktop/src/config/portfolioService.ts`.
