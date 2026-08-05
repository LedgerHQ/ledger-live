# Hedera ERC20 operation parsing — open issues

Investigation notes for the ERC20 side of `libs/coin-modules/coin-hedera`, written while
reviewing `fix/hedera-packed-operations`. That branch fixed packed/multi-asset parsing for
**HTS** transfers (`processHTSTokenTransfers`, `processCoinTransfers`). The **ERC20** path
(`processERC20TokenTransfer`) was not touched and still has the problems below.

All findings are backed by real mainnet transactions listed here, so they can be reproduced
without spending anything.

## Data sources

```
mirror node : https://hedera.coin.ledger.com/api/v1
hgraph      : https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql
```

Both were reachable without auth at the time of writing.

### Raw ERC20 rows for a transaction (hgraph)

```bash
HASH=0x4641150f9c0634b3b26cd0793784c0f6f517d24d361d5854df97540abd9f82af

curl -s -X POST https://hedera-indexer-mainnet.coin.ledger.com/v1/graphql \
  -H 'content-type: application/json' \
  -d "{\"query\":\"query { erc_token_transfer(where:{transaction_hash:{_eq:\\\"$HASH\\\"}}, order_by:{log_index:asc}) { log_index token_evm_address sender_account_id sender_evm_address receiver_account_id receiver_evm_address amount transfer_type contract_type } }\"}" \
  | python3 -m json.tool
```

`erc_token_transfer` columns (from GraphQL introspection): `amount`, `consensus_timestamp`,
`contract_type`, `log_index`, `operator_account_id`, `operator_evm_address`, `partition_id`,
`payer_account_id`, `payer_evm_address`, `receiver_account_id`, `receiver_evm_address`,
`sender_account_id`, `sender_evm_address`, `token_evm_address`, `token_id`,
`transaction_hash`, `transfer_type`.

Note `log_index` is **not** currently selected by `getERC20Transfers` (`network/hgraph.ts:101`)
nor present on the `ERC20TokenTransfer` type (`types/hgraph.ts:24`).

### Matching mirror transaction

The contract result resolves the hash to a consensus timestamp; the transactions endpoint then
returns the record with `transfers` / `token_transfers`.

```bash
TS=$(curl -s "https://hedera.coin.ledger.com/api/v1/contracts/results/$HASH" \
     | python3 -c "import json,sys;print(json.load(sys.stdin)['timestamp'])")

curl -s "https://hedera.coin.ledger.com/api/v1/transactions?timestamp=$TS" | python3 -m json.tool
```

## Relevant code path

| Step | Location |
|---|---|
| hgraph query for ERC20 rows | `network/hgraph.ts:101` `getERC20Transfers` |
| group rows by tx hash, attach mirror tx | `network/utils.ts:237` `enrichERC20Transfers` |
| drop mirror txs that have ERC20 rows | `logic/utils.ts:527-538` `mergeTransactionsFromDifferentSources` |
| build token + FEES ops | `logic/listOperations.v2.ts:135` `processERC20TokenTransfer` |
| raw operation id | `logic/listOperations.v2.ts:190` |
| bridge re-keys ids | `bridge/utils.ts:118` `assignBridgeOperationIds` |
| dedupe on sync (last write wins) | `libs/ledger-wallet-framework/src/bridge/jsHelpers.ts:158-162` `mergeOps` |

---

## Finding 1 — multiple rows to the same recipient are dropped, not summed

### What happens

`processERC20TokenTransfer` emits one operation per hgraph row, with id
(`listOperations.v2.ts:190`):

```ts
id: `${commonFields.hash}:${commonFields.type}:${tokenEvmAddress}`
```

No recipient, no log index. `assignBridgeOperationIds` (`bridge/utils.ts:118`) then re-keys to
`encodeOperationId(accountId, hash, type)` plus `recipients[0]` as a discriminator when the base
id repeats. That rescues the multi-**recipient** case, but when several rows share the same
recipient every op still ends up with an identical id. `mergeOps` does
`newOpsIds[op.id] = op` — **last write wins, the others are discarded rather than summed**.

Result: one operation carrying a single row's amount. Which row survives depends on the order
hgraph returned them in.

### Example transaction

```
hash    0x4641150f9c0634b3b26cd0793784c0f6f517d24d361d5854df97540abd9f82af
txId    0.0.10561221-1784131952-300919517
ts      1784131963.496425000
type    ETHEREUMTRANSACTION
token   0xd7d4d91d64a6061fa00a94e2b3a2d2a5fb677849
account 0.0.10608795 (the ERC20 sender)
```

hgraph rows:

| log_index | receiver | amount | transfer_type |
|---|---|---|---|
| 2 | `0xcf06472d164f4fe2cc18b39f18cbace9440e8cc3` | 47000 | transfer |
| 5 | `0xcf06472d164f4fe2cc18b39f18cbace9440e8cc3` | 36000 | transfer |
| 8 | `0xcf06472d164f4fe2cc18b39f18cbace9440e8cc3` | 45000 | transfer |
| 11 | `0xcf06472d164f4fe2cc18b39f18cbace9440e8cc3` | 24000 | transfer |
| 13 | `0xa2c2713e82b47dcb3b0bae75199c81fcd185b86c` | 182 | transfer |

Expected for account `0.0.10608795`: an OUT op of **152000** to `0xcf0647…`, plus an OUT op of
182 to `0xa2c271…`. Actual: one op for `0xcf0647…` worth a single row's amount.

Second instance, same account/token/recipient:

```
hash    0x5fe0d58fbd40ae6f76db74b04b3807eba3692d664c0c7944dcf3bd8ab442741f
txId    0.0.10561221-1784116367-674709427
ts      1784116377.302840000
rows    48000 + 43000 + 38000 + 24000 -> 0xcf06472d…  (expected total 153000)
        183 -> 0xa2c2713e…
```

### How common

Sampled the last 3000 `erc_token_transfer` rows with a non-null `sender_account_id`:

- 193 of 1977 (tx, token, sender) groups have more than one row (~10%)
- **6 groups collide even after the bridge discriminator** — i.e. silently lose value

### Suggested fix

Aggregate rather than disambiguate. Group the rows of a tx by
`(token_evm_address, derived type, counterparty)` and **sum** `amount` before building the
operation, then use `${hash}:${type}:${token}:${counterparty}` as the id — unique by
construction.

This matches what the HTS path already does: `sumNetByAccount` in `network/utils.ts` nets per
account, so repeated movements to the same counterparty collapse into one summed op. Adding a
`log_index` discriminator instead would produce one op per log entry, which is inconsistent with
the HTS behaviour and noisier for the user.

---

## Finding 2 — HBAR movement is lost on contract-call transactions

### What happens

`mergeTransactionsFromDifferentSources` (`logic/utils.ts:527-538`) filters out **every** mirror
transaction whose `transaction_hash` has an ERC20 transfer for the synced account, parent and
children alike, to avoid duplicating the contract call. The ERC20 branch then only emits token
ops plus a FEES op.

So when a transaction moves both an ERC20 token and HBAR for the same account — a swap — the
HBAR leg never becomes an operation. Balance still comes from the account endpoint and updates
correctly, so the user sees HBAR appear or disappear with no matching history entry.

### Example transaction

```
hash    0xc59dd1c6bd0fdf25c94ca701aac1a79dcef56a1b46f315be274b09b777a289a7
txId    0.0.9337684-1785752360-391942259
ts      1785752373.949418104
type    CONTRACTCALL
account 0.0.9337684
fee     139069348
```

mirror `transfers`:

```json
[{"account":"0.0.802","amount":139069348},
 {"account":"0.0.1456985","amount":-95138768148},
 {"account":"0.0.9337684","amount":94999698800}]
```

hgraph rows:

```
log_index 0  sender 0.0.9337684 -> 0xcec8716c…  116858897016  transfer
log_index 14 sender 0xcec8716c… -> 0x0            116858897016  burn
```

The account sells the token and receives **949.99 HBAR**. Ledger Live shows the token OUT op and
a FEES op; the +949.99 HBAR credit is missing entirely.

More instances of the same shape (all account `0.0.9337684`, token
`0x1b90b8f8ab3059cf40924338d5292ffbaed79089`, HBAR credited beyond fee):

| hash | HBAR beyond fee (tinybar) |
|---|---|
| `0x07d75bc3a14df40017cb7279929b3dd26d452634cde4a5fd510b5e85c927d907` | 94191859483 |
| `0x8cb0d370a67cd40b8a0b53d169e11912b8f0af3cbab469847bf890847c9143f9` | 97135735701 |
| `0xd676b112809eead2413198da17862c435ffacc29de99d761e06af358d74a3836` | 119373924477 |
| `0x471a9f0b5bc034b333357d788912fdea5812a6d12900d9c9aca1a2a09f447385` | 85167360024 |

Different account, same pattern:

| hash | account | HBAR beyond fee |
|---|---|---|
| `0x1dbcf6df710ac23ece1a297e0ad3843594f5f2555b9430e0fc70ece6b73969a4` | 0.0.508876 | 24306145621 |
| `0x7b085b5c0c74fd1d28714db35850567ba3ad292ba71aa62d1d75b083682779f3` | 0.0.7164995 | 16984041833 |

### How common

Of 33 sampled transactions where the account was an ERC20 sender, **5 also had HBAR movement
beyond fees for that same account** (~15%).

### Note on crafting

Ledger Live cannot build such a transaction — `craftTransaction` uses `TransferTransaction` and
`ContractExecuteTransaction` separately, and the SDK keeps them as separate classes. But a
payable `ContractExecuteTransaction` moves HBAR *and* emits ERC-20 `Transfer` logs in one
transaction, which is what every dApp swap does. This is a parsing problem, not a crafting one.

### Suggested fix

Don't discard the whole mirror record. Keep the coin-transfer parsing for contract-call
transactions and only suppress the parts that would duplicate the ERC20 rows. This is a design
change in `mergeTransactionsFromDifferentSources`, bigger than Finding 1.

---

## Finding 3 — FEES op attributed to an account that did not pay (relayed transactions)

`processERC20TokenTransfer` creates a FEES coin operation whenever the tx contains an OUT
transfer (`listOperations.v2.ts:198`), charging `charged_tx_fee` to the synced account.

On a relayed `ETHEREUMTRANSACTION` the fee payer is the relayer, not the token sender. In the
Finding 1 example:

```
hash      0x4641150f9c0634b3b26cd0793784c0f6f517d24d361d5854df97540abd9f82af
txId      0.0.10561221-…      <- relayer pays
transfers [{"account":"0.0.802","amount":68764076},
           {"account":"0.0.10561221","amount":-68764076}]
```

Account `0.0.10608795` (the ERC20 sender, the one being synced) has **no debit at all** in the
record, yet a FEES op of 68764076 tinybar is produced for it. `senders` is set from
`commonData.extra.feesPayer`, so the op even names the relayer as sender while sitting in the
account's own history.

`skipFeesForTokenOperations` is `true` on the API path (`api/index.ts:108`) but `false` on
account sync (`bridge/synchronisation.ts:77`), so the app is the affected surface.

Fix: only emit the FEES op when `extra.feesPayer` is the synced address. Confirm the intent
before changing — this may have been deliberate.

---

## Minor issues seen along the way

**Falsy `account_id: 0`.** `listOperations.v2.ts` uses
`transfer.receiver_account_id ? toEntityId(...) : transfer.receiver_evm_address`. Mint/burn rows
carry `receiver_account_id: 0` / `sender_account_id: 0`, which is falsy, so the code falls
through to the evm address. It happens to give the right answer (`0x000…0`) but for the wrong
reason. Example: `0xe725a4a278f5fcb906571d4473d97f31410584658614683012ed1a0f42ab175a`
(account `0.0.10783091`, one `burn` row with `receiver_account_id: 0` and one `transfer` row).

**Number precision.** `ERC20TokenTransfer.amount` and `consensus_timestamp` are typed `number`
(`types/hgraph.ts:24`) and the indexer returns them as JSON numbers. Observed on the wire:
`1785914466237144104` — past `Number.MAX_SAFE_INTEGER`, so `JSON.parse` truncates it. Timestamps
are already losing nanosecond precision; an 18-decimal token amount would too. Pre-existing,
unrelated to this branch.

---

## What already works — don't "fix" it

- **Several different tokens in one contract call.** `processERC20TokenTransfer` loops over all
  rows of the tx hash; distinct `token_evm_address` means distinct ids and distinct token
  sub-accounts, so these already produce separate ops.
- **Several recipients, same token.** Broken at the raw-id level but rescued by the
  `recipients[0]` discriminator in `assignBridgeOperationIds`. Fixing Finding 1 properly makes
  the rescue unnecessary; leaving the discriminator in place is harmless.
- **HTS + ERC20 in one transaction.** Not observed. `token_transfers` was empty on every sampled
  ERC20 transaction (20 of 20). HTS precompile transfers land in child records, which the
  Finding 2 filter also drops, so the risk is structural — but there is no confirmed instance.

## Testing

Preferred: **integration test against the transactions above**, no funds needed. The API path
(`api/index.ts:108`) accepts any address and pulls `tokenEvmAddresses` from hgraph balances
rather than CAL. Point `listOperations` at `0.0.10608795` and assert the summed value for
`0x4641150f…`; point it at `0.0.9337684` and assert the HBAR leg of `0xc59dd1c6…`.

If reproducing on a real account is wanted: a small **token → HBAR swap on SaucerSwap** produces
exactly the Finding 2 shape (ERC20 OUT row + HBAR credit in one transaction) and no contract
deployment is needed. Caveat: for the account-sync path the token must be listed in CAL with
`tokenType === "erc20"` — `bridge/synchronisation.ts:77` filters on it — so check that first, or
test through the API path which skips CAL.
