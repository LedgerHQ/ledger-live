# Ledger Live Dummy PTX App

The purpose of this app is to allow automated front end testing of Ledger Live PTX apps, and verify that Ledger Live correctly passes parameters to the Live app

## How to run locally for development

Run `pnpm --filter="dummy-ptx-app" start`.

## Quick script to build the app from scratch

To use the Dummy app in the Playwright tests, you must install and build the dependencies and source code for the dummy app. To do this run the following from the root folder of this monorepo:

`pnpm clean && pnpm --filter="dummy-ptx-app" i && pnpm --filter="dummy-ptx-app" build`

Then run `pnpm --filter="dummy-ptx-app" serve`
