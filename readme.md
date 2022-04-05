# Ledger Live

## What is this ?

This repositories contains all JavaScript ecosystem to handle the development and release of Ledger Live Apps.

## Structure

```
| .changeset/ # contains all the changelogs to be applied when bumping version
| .github/ # everything related to github automation and setup
| apps/
  --| ledger-live-desktop/ # desktop app
  --| ledger-live-mobile/  # mobile app
  --| cli/                 # cli interface for Ledger Live
| libs/
  --| ledger-live-common/  # shared logic for apps
  --| ledgerjs/            # open source libraries to work with Ledger products
  --| ui/                  # Ledger design system for Ledger apps
| tools/
  --| actions/             # reusable github actions
  --| create-release-hash/ # used during release process
  --| metro-extra-config/  # shared metro config
  --| migrate-branch/      # script to import branch from other repositories
  --| native-module-tools/ # black magic ?
  --| pnpm-utils/          # black magic 2 ?
  --| scripts/             # collection of git scripts to setup mono repo
  --| x-run/               # wrapper around turbo repo run
| .gitignore
| .npmrc
| .pnpmfile.cjs
| package.json
| pnpm-lock.yml
| pnpm-workspace.yml # workspace config
| turbo.json         # turbo config file
```

## Installation
