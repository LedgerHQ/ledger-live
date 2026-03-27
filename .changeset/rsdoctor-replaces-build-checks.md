---
"ledger-live-desktop": minor
"live-mobile": minor
---

Replace build-checks GitHub Action with Rsdoctor for bundle analysis. Adds doctor scripts, @rsdoctor/rspack-plugin, and `tools/actions/rsdoctor-pr-validator` wired into the PR build workflow (artifacts from desktop/mobile builds).