# Debugging the JavaScript bundle

Deep bundle analysis (Rsdoctor) runs in CI via the dedicated **[Rsdoctor] - Bundle reports on PR** workflow on pull requests. The main **Build and Test - PR** workflow still runs **build-checks** as before.

Locally:

```bash
pnpm --filter ledger-live-desktop run doctor
```

Reports are written under `rsdoctor/desktop-<bundle>/`. Open the generated HTML or use the PR comment from the Rsdoctor action for diff views.
