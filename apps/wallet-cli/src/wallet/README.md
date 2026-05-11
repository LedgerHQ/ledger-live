# CLI Wallet Layer

Clean, serializable wallet interface for the CLI. Sits between the legacy live-common bridge stack and CLI commands. All returned types are plain JSON-safe values (no `BigNumber`, no `Date`, no circular refs).

## Routing

`WalletAdapter` in `index.ts` routes each operation to the right backend:

- **balances** — Alpaca for supported families (fast direct API); bridge sync otherwise.
- **operations** — always bridge sync. Alpaca is currently bypassed due to known correctness issues (missing internal ops, unreliable pagination); the routing code is preserved as a comment for when it is re-enabled.
- **everything else** (`discoverAccounts`, `getFreshAddress`, `verifyAddress`, `prepareSend`, `send`) — always bridge sync.

## Internal structure

```
wallet/
  models.ts          ← serializable types + Zod schemas
  index.ts           ← WalletAdapter (routing)
  intents/           ← TransactionIntent schemas (bitcoin, evm, solana)
  formatter/         ← HumanFormatter and JsonFormatter
  compatibility/
    bridge.ts        ← BridgeAdapter (full sync via live-common bridge)
    coinframework.ts ← CoinFrameworkAdapter (direct Coin Module API — currently unused for ops)
```

`compatibility/` is an internal implementation detail — do not import it directly from outside `wallet/`.

## Integration

All setup (live-common coin graph, supported currencies, transport) is handled by `live-common-setup.ts` and `env-setup.ts` at CLI startup. See those files for the reference implementation.
