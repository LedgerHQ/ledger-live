# Ledger Live Dummy Wallet App

The purpose of this app is to allow automated front end testing of Ledger Live Wallet apps, and verify that Ledger Live correctly:

- handles the rendering of external Live Apps
- handles calls of the Live SDK from external Live apps

The app is a simple [Create React App](https://github.com/facebook/create-react-app) which uses the [Ledger Live App SDK](https://www.npmjs.com/package/@ledgerhq/live-app-sdk). It has some buttons that have hardcoded responses that can be triggered from the playwright tests, thus allowing us to check the UI. This means the app isn't suitable for manual testing or full E2E testing since it is not dynamic, and does not make calls to external services or the Nano itself.

## How to run locally for development

Run `pnpm --filter="dummy-wallet-app" start`.

## Quick script to build the app from scratch

To use the Dummy app in the Playwright tests, you must install and build the dependencies and source code for the dummy app. To do this run the following from the root folder of this monorepo:

`pnpm clean && pnpm --filter="dummy-wallet-app" i && pnpm --filter="dummy-wallet-app" build`

Then run `pnpm --filter="dummy-wallet-app" serve`
