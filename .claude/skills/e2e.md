# E2E Desktop Testing

Playwright + Speculos for ledger-live-desktop E2E tests.

## When to Use

- Adding send/receive e2e tests for a new coin
- Updating existing test configurations
- Working with Speculos device simulator

## Project Structure

- `e2e/desktop/tests/specs/` — test scenarios (`.spec.ts`)
- `e2e/desktop/tests/page/` — Page Objects with reusable actions
- `e2e/desktop/tests/utils/` — CLI utilities, Speculos helpers
- `libs/ledger-live-common/src/e2e/` — shared e2e enums and families

## Environment Setup

```bash
export COINAPPS=/path/to/coin-apps
export SEED="your 24 words seed phrase here"
export SPECULOS_IMAGE_TAG=ghcr.io/ledgerhq/speculos:latest
export SPECULOS_DEVICE=nanoSP  # nanoS, nanoSP, nanoX, stax, flex, nanoGen5
export MOCK=0
```

## Adding New Coin E2E Test

1. **Network enum** — `libs/ledger-live-common/src/e2e/enum/Network.ts`
2. **AppInfos** — `libs/ledger-live-common/src/e2e/enum/AppInfos.ts`
3. **Currency** — `libs/ledger-live-common/src/e2e/enum/Currency.ts`
4. **Accounts** — `libs/ledger-live-common/src/e2e/enum/Account.ts`
5. **Family file** — `libs/ledger-live-common/src/e2e/families/newcoin.ts` (reuse existing if same family)
6. **speculos.ts** — add to `specs` object and `signSendTransaction` switch
7. **Test case** — `e2e/desktop/tests/specs/send.tx.spec.ts`
8. Rebuild: `pnpm build:lld:deps`

## MANDATORY: Test on All 6 Devices

| Device | Model ID |
|--------|---------|
| LNS | `nanoS` |
| LNSP | `nanoSP` |
| LNX | `nanoX` |
| STAX | `stax` |
| FLEX | `flex` |
| NG5 | `nanoGen5` |

```bash
SPECULOS_MODEL=nanoS DISABLE_TRANSACTION_BROADCAST=1 pnpm test:desktop e2e:playwright specs/folder/file.spec.ts
# Repeat for each model
```

## Commands

```bash
pnpm build:lld:deps                            # Build deps
pnpm desktop build:testing                     # Build test app
pnpm e2e:desktop test:playwright specs/...    # Run test
PWDEBUG=1 ... pnpm e2e:desktop test:playwright # Debug mode
pnpm e2e:desktop allure                        # View Allure report
```

## Best Practices

- **Never use hardcoded timeouts** — `page.waitForTimeout(1000)` is forbidden
- Use `@step` decorator in Page Objects
- Access methods via `app` fixture (`app.layout`, `app.send`, `app.speculos`)
