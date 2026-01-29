---
"ledger-live-desktop": minor
"live-mobile": minor
---

Replace build-checks GitHub Action with Rsdoctor for bundle analysis. Adds doctor and doctor:check scripts, @rsdoctor/rspack-plugin, duplicate-package blocklist checks, and rsdoctor-pr workflow. Removes tools/actions/build-checks and metafile-based reporting.
