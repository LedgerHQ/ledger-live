# @features/platform-chain-integrators

> [!NOTE]
> **Status: STABLE** — Production-ready; API is considered stable.

Registry of the chains integrated by third-party teams, and the "Integrated by {team}." notice
shown for their accounts (Account Detail page, LWD and LWM). The notice is informational only: not
pressable, no drawer.

## Exports

| Export | Description |
| --- | --- |
| `ChainIntegratorNotice` | Info icon + "Integrated by {team}." for a crypto currency; renders nothing for chains integrated by Ledger (`.web` / `.native`) |
| `getChainIntegrator` | Team that integrated a currency family, or `null` |
| `CHAIN_INTEGRATORS` | Integrator id → team name |
| `INTEGRATED_CHAIN_FAMILIES` | Currency family → integrator id |
| `ChainIntegrator`, `ChainIntegratorId`, `IntegratedChainFamily`, `ChainIntegratorNoticeProps` | Types |

`ChainIntegratorNotice` takes the account's main currency as a `CryptoCurrency` from
`@domain/entity-currency-crypto` (not a raw family string, which the domain types as a plain
`string`), and looks it up by its **family**, so testnets (e.g. Solana devnet) and token
sub-accounts are covered without extra entries.

## Usage

```tsx
import { ChainIntegratorNotice } from "@features/platform-chain-integrators";

<ChainIntegratorNotice currency={mainAccount.currency} />;
```

## How to add / remove a chain

Everything lives in [`src/chainIntegrators.ts`](./src/chainIntegrators.ts):

1. **New team**: add one line to `CHAIN_INTEGRATORS` (id → displayed name, alphabetical). Team names
   are proper nouns: they are not translated.
2. **New chain**: add one line to `INTEGRATED_CHAIN_FAMILIES` (family → integrator id, alphabetical).
3. **Removed chain**: delete its line, and its team's line if no other chain uses it.
4. Run `pnpm test`.

Guards:

- **Compile time**: a family can only point to a declared integrator (`satisfies`).
- **Tests**: every family exists in the currency registry (`@domain/entity-currency-crypto`), every
  integrator is used at least once, and both tables are sorted alphabetically.

The wording ("Integrated by {{team}}.") is the `chainIntegrators.integratedBy` key in the English
catalog of each app.
