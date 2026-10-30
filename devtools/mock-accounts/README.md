# @devtools/mock-accounts

Generates mock accounts for UI testing: account descriptors with the `mock` purpose (see [`@domain/entity-account-descriptor`](../../domain/entity/account-descriptor)), added to the accounts slice as remote-only entries.

> [!IMPORTANT]
> The mocks are light, library-less implementations: no mock or fake-data library (faker, msw, …), only a small seeded random (`src/random.ts`) and plain code per family and kind. This keeps the tool small and fast to load; keep it that way when adding a family or a kind.

Their data comes from `mockSource`, which supports `mock` descriptors only. When the tool loads, it adds the source to the store's router at runtime (`addAccountDataSource` in `@domain/api-account-data`): no app ranks it, and the tool is lazy-loaded through `@devtools/registry`, so none of this reaches the app bundle. Mock accounts are not persisted; they go away with the app's state, as does the source.

## Families and kinds

Everything is seeded: the same network and index give the same descriptor, the same account and kind give the same data.

| | Adds | Where |
| --- | --- | --- |
| a family | how its mock accounts look (descriptor type, key, path), its addresses, and, optionally, its own reader of some kinds | `src/families/<family>.ts`, listed in `src/families/index.ts` by `CryptoCurrency.family` |
| a kind | its generic reader, used by every family without its own | `src/kinds/<kind>.ts`, listed in `src/kinds/index.ts`, plus one line in `mockSource.read` |

A family only overrides the kinds where it differs, so adding a family or a kind is one file, not one per pair.

- `bitcoin`: utxo accounts with a valid xpub (tpub on testnets), native segwit (`m/84h/<coin type>h/<index>h`) on bitcoin and litecoin, BIP44 on the others; balance up to 2 coins, all spendable, one account in six empty.
- `evm`: EIP-55 addresses on the Ledger Live path; balance up to 5 coins, and USDC / USDT on ethereum.
- any other family: a base58 address, and the generic readers (`balance`: the native coin, up to 100 coins).

Every family uses the generic `operations` reader: receives and sends adding up to each asset's balance (an empty asset has none), fees in the native coin only, one account in ten with its newest operation pending. Dates count back from a fixed day, so the operations stay seeded.

It is paginated, to test the next pages: `limit` rows per page (20 when the query has none), pending first then newest first. By default most accounts have a few operations and one in five has a long history (50 to 200 per asset) spanning several pages. To control it, fill "Operations per account" before Generate (up to 10 000): each generated account gets that many operations, split evenly across its funded assets (at least one per funded asset). The count lives in memory with the tool, like the accounts. `nextCursor` is the id of the page's last row, absent on the last page; a cursor naming no row of the account fails the read with `MockCursorError`.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.claude/skills/devtools-import-boundary/SKILL.md)). Its props come from `useMockAccountsToolProps` in `@devtools/bindings`.
