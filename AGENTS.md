# Project Context

## Overview

- "Ledger Wallet" (formerly "ledger-live") is a crypto wallet
- This pnpm and nx monorepo provides frontend apps

## Common Commands

- Use pnpm commands for build, dev, linting and testing.
- See [/docs/common-commands.md](/docs/common-commands.md)

## Validate Before Finishing

- Before finishing any agentic code change, run static checks for the affected scope
- See [/docs/validate-before-finishing.md](/docs/validate-before-finishing.md)

## Contacts feature (internal alpha)

- If working on the Contacts feature in Ledger Wallet Desktop, also read
  [`apps/ledger-live-desktop/docs/contacts.md`](apps/ledger-live-desktop/docs/contacts.md).
- For current rollout state, also see
  [`apps/ledger-live-desktop/docs/contacts-status.md`](apps/ledger-live-desktop/docs/contacts-status.md).
- All new Contacts UI must use the Lumen design system
  (`@ledgerhq/lumen-ui-react` + `@ledgerhq/lumen-ui-react/symbols`). No
  `styled-components`, no `@ledgerhq/react-ui` in new Contacts code.
