# Debugging the JavaScript bundle

Bundle analysis runs in CI via the **Rsdoctor PR validator** job in the `[All Platforms] - Build and Test - PR` workflow (`tools/actions/rsdoctor-pr-validator` uses artifacts from desktop/mobile builds). Locally, use the doctor script:

```bash
RSDOCTOR=1 pnpm run doctor
# or
pnpm --filter ledger-live-desktop run doctor
```

Reports are written under `rsdoctor/desktop-<bundle>/`. Open the generated HTML or use the PR comment from the Rsdoctor action for diff views.
