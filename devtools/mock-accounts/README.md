# @devtools/mock-accounts

Generates mock accounts for UI testing: account descriptors with the `mock` purpose (see [`@domain/entity-account-descriptor`](../../domain/entity/account-descriptor)), added to the accounts slice as remote-only entries.

Their data comes from `mockSource`, which supports `mock` descriptors only. When the tool loads, it adds the source to the store's router at runtime (`addAccountDataSource` in `@domain/api-account-data`): no app ranks it, and the tool is lazy-loaded through `@devtools/registry`, so none of this reaches the app bundle. Mock accounts are not persisted; they go away with the app's state, as does the source.

## Families and kinds

Everything is seeded: the same network and index give the same descriptor, the same account and kind give the same data.

| | Adds | Where |
| --- | --- | --- |
| a family | how its mock accounts look (descriptor type, key, path) and, optionally, its own reader of some kinds | `src/families/<family>.ts`, listed in `src/families/index.ts` by `CryptoCurrency.family` |
| a kind | its generic reader, used by every family without its own | `src/kinds/<kind>.ts`, listed in `src/kinds/index.ts`, plus one line in `mockSource.read` |

A family only overrides the kinds where it differs, so adding a family or a kind is one file, not one per pair.

- `bitcoin`: utxo accounts with a valid xpub (tpub on testnets), native segwit (`m/84h/<coin type>h/<index>h`) on bitcoin and litecoin, BIP44 on the others; balance up to 2 coins, all spendable, one account in six empty.
- `evm`: EIP-55 addresses on the Ledger Live path; balance up to 5 coins, and USDC / USDT on ethereum.
- any other family: a base58 address, and the generic readers (`balance`: the native coin, up to 100 coins).

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useMockAccountsToolProps` in `@devtools/bindings`.
