# @domain/entity-token-currency

Domain entity for token currencies: Zod-first schema with FK-based parent currency reference.

## Key Design

`parentCurrencyId: CurrencyId` (FK) replaces the legacy `parentCurrency: CryptoCurrency` (embedded object). This eliminates the lookup-at-restore problem in `cal-client/persistence.ts` — the serialized form equals the domain form, so no `toTokenCurrencyRaw`/`fromTokenCurrencyRaw` conversion is needed. Resolving the parent for display: `cryptoCurrencyByIdSelector(state, token.parentCurrencyId)`.

No Redux slice, no static registry — tokens are served dynamically via `@domain/api/crypto-assets` (RTK Query).

## Usage

```ts
import { TokenCurrencySchema, type TokenCurrency } from "@domain/entity-token-currency";

const token: TokenCurrency = TokenCurrencySchema.parse({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd-tether",
  parentCurrencyId: "ethereum",
  contractAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  tokenType: "erc20",
  name: "Tether USD",
  ticker: "USDT",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
});
```

Or use the `token()` helper which calls `parse()` for you:

```ts
import { token } from "@domain/entity-token-currency";

const usdt = token({
  type: "TokenCurrency",
  id: "ethereum/erc20/usd-tether",
  parentCurrencyId: "ethereum",
  // ...
});
```

## Schema

| Field                 | Type       | Required | Description                                           |
| --------------------- | ---------- | -------- | ----------------------------------------------------- |
| `type`                | `"TokenCurrency"` | yes | Discriminant literal                           |
| `id`                  | `TokenId`  | yes      | Unique opaque token id (e.g. `"ethereum/erc20/usd-tether"`) |
| `parentCurrencyId`    | `CurrencyId` | yes    | FK to parent crypto currency (e.g. `"ethereum"`)      |
| `contractAddress`     | `string`   | yes      | On-chain contract address                             |
| `tokenType`           | `string`   | yes      | Token standard (e.g. `"erc20"`, `"bep20"`)            |
| `name`                | `string`   | yes      | Human-readable name (e.g. `"Tether USD"`)             |
| `ticker`              | `string`   | yes      | Ticker symbol (e.g. `"USDT"`)                         |
| `units`               | `Unit[]`   | yes      | Display units — at least one required                 |
| `delisted`            | `boolean`  | no       | Hide from new flows when `true`                       |
| `disableCountervalue` | `boolean`  | no       | Disable countervalue display when `true`              |
| `ledgerSignature`     | `string`   | no       | Ledger's cryptographic signature for the token listing |

## Testing

```sh
pnpm test          # run tests
pnpm typecheck     # tsc --noEmit
```

Mock factory available in `src/schema.mock.ts`:

```ts
import { mockTokenCurrency } from "@domain/entity-token-currency/src/schema.mock";

const token = mockTokenCurrency({ delisted: true });
```
