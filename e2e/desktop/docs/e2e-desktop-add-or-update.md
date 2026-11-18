# Adding or updating a desktop E2E test

This document guides you through adding or updating E2E tests for ledger-live-desktop using Playwright and Speculos.

## When to Use

- Adding send/receive e2e tests for a new coin: follow [Adding a coin](e2e-desktop-add-coin.md)
- Updating existing test configurations
- Working with Speculos device simulator
- Troubleshooting e2e test issues

---

## Project Structure

- `e2e/desktop/tests/specs/` — test scenarios (`.spec.ts`)
- `e2e/desktop/tests/page/` — Page Objects with reusable actions
- `e2e/desktop/tests/utils/` — desktop test helpers (tags, feature flags, Allure)
- `libs/live-e2e-shared/src/` — shared e2e enums, families, and Speculos helpers

---

Machine setup, build and run commands: the [README](../README.md) and `/e2e-desktop-onboard`.

---

## Test Configuration Reference

```typescript
test.use({
  userdata: "skip-onboarding",
  speculosApp: transaction.accountToDebit.currency.speculosApp,
  cliCommands: [liveDataWithRecipientAddressCommand(transaction)],
});
```

- **Userdata:** `skip-onboarding`, `1AccountBTC1AccountETH`
- **Speculos:** `Account.currency.speculosApp`
- **CLI commands:** `liveDataCommand`, `liveDataWithAddressCommand`, `liveDataWithRecipientAddressCommand`

---

## Finishing

Follow [validate-before-finishing](../../../docs/validate-before-finishing.md), then:

Dispatch filtered desktop CI (`/run-e2e-ci`) and read Allure, not just the green check. A retry hides a failed first attempt.

Comments follow `/comments`. Keep only those recording a non-obvious reason.
