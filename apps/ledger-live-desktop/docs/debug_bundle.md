# Debugging the JavaScript bundle

- We use [Rsdoctor](https://rsdoctor.rs) for bundle analysis
- PRs are checked via `.github/workflows/rsdoctor-pr.yml`

Run locally:

```bash
pnpm --filter ledger-live-desktop run doctor
```

Reports are written under `rsdoctor/desktop-<bundle>/`. Open the generated HTML or use the PR comment from the Rsdoctor action for diff views.
