# Debugging the JavaScript bundle

Bundle size and duplicate-package analysis run in CI via the **[Rsdoctor] - Bundle reports on PR** workflow. Locally, use the doctor script:

```bash
RSDOCTOR=1 pnpm run doctor
# or
pnpm --filter ledger-live-desktop run doctor
```

Reports are written under `rsdoctor/desktop-<bundle>/`. Open the generated HTML or use the PR comment from the Rsdoctor action for diff views.
