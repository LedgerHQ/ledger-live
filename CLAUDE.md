ledger-live is a monorepo for "Ledger Wallet" frontend apps and libraries.

Usage:
    proto use
    pnpm --filter <scope> build|test|lint|typecheck|lint:fix [-- <path>]

notable scopes: ledger-live-desktop, live-mobile, live-common
  (any package: drop @ledgerhq/ prefix)

modified app/lib must build, lint, typecheck and pass test.
