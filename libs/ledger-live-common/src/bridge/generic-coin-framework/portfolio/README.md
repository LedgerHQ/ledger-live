# Generic bridge on the portfolio layer

> [!CAUTION]
> **Status: UNSTABLE**: proof of concept of ADR-064 Option 1.

The generic bridge serves a currency through the `PortfolioApi` (`@ledgerhq/portfolio-module-framework`) when its coin
config enables it, and through its legacy path (coin module, or account module binding) otherwise. The UI is unchanged:
it keeps calling the account and currency bridges, and the family helpers listed below, which pick the path themselves.

## Enabling a chain

```ts
// config_currency_<id>, the coin config of the currency
{ ...coinConfig, portfolio: { enabled: true, mode: "local" } } // mode: "local" (default) | "hybrid" | "remote"

// config_portfolio_service, the service of the "hybrid" and "remote" modes; these are the defaults
{ url: "https://portfolio-service.api.ledger-test.com", portfolioId: "ledger-wallet" }
```

An empty `url` turns the service off: a chain in `hybrid` or `remote` mode then fails with `UNAVAILABLE` wherever it
needs the service. The modes are those of the
[framework](../../../../../portfolio-module-framework/README.md#mode-per-chain), routed by
`@ledgerhq/portfolio-module-hybrid`.

## What goes through the portfolio

With `portfolio.enabled`, nothing the bridges and the family helpers below call reaches the network, a coin module or
an account module around the portfolio layer: every row below goes through `PortfolioApi`. What stays in Ledger Wallet
is the device (signer), pure mapping and presentation, its catalog (CAL) and config, and the store it provides to the
local side. Handing its coin module and account module to `createLocalPortfolio` is wiring, not a call. The reads
outside that scope are named under [Limitations](#limitations) (V1, V2, O13).

An account call opens the portfolio of its account (`openAccountPortfolio` in [account.ts](account.ts)). The account
is the local side's store: it is seeded from the account's operations, pending operations and persisted module state,
and the account keeps what the call reads back. The service persists its own side. A call that opens no account
(broadcast, raw signing, address validation, chain reads, the family helpers) opens the network portfolio of the
currency (`openNetworkPortfolio` in [network.ts](network.ts)), with the same wiring and no registration.

| Bridge call | Portfolio call |
| --- | --- |
| sync, scan (`getAccountShape`) | `sync`, `getPortfolio` (the account's `error`), `getPortfolioBalance`, `getUpdates` (every asset), `getLastBlock`, `getValidators`, and the family hooks' chain reads (`getAccountInfo`, `call`); a family with a binding: `getFreshAddress`, `getAccountUtxos`, no `getLastBlock` |
| scan of a family that looks addresses up (Hedera) | `getAddressesForPublicKey` |
| `receive` | none: the device, then the family's `keyControlsAccount` (offline) |
| `prepareTransaction`, `estimateMaxSpendable` | `estimateTransactionFee`, the fee options in `networkParams.feeParameters` (none for a send-max estimate) |
| `getTransactionStatus` | `validateTransaction` (unvalidated status in `remote` mode: the service serves none) |
| `signOperation` | `getNextSequence` (every mode), `encodeTransaction`, device signature, `combineTransaction` |
| `signRawOperation` | `getNextSequence`, `encodeRawTransaction`, device signature, `combineTransaction`; the cosmos and bitcoin overrides sign on the device alone |
| `broadcast` | the family's pre-check through the chain reads (EVM: `getNextSequence`, `getTransactionInfo`), then `broadcastTransaction` with the broadcast config, in every mode |
| `validateAddress` | `validateAddress`, with the network id when one is given |
| `buildGenericTransactionIntent` | none: the intent of the write path, its `data` left to the side writing |
| `getSponsoredCoinApi` | none: `null`, the Send flow offers the standard fee only (S1) |
| EVM `getEditTransactionPatch`, gas options of the Send flow | `estimateTransactionFee`, its `parameters.gasOptions` |
| EVM `isTransactionConfirmed` | `getTransactionInfo`; unsupported, the synced operations answer (bitcoin's rule) |
| EVM token allowance | `call` (`eth_call` of `allowance(owner, spender)`) |
| bitcoin edit patch, edit status, `hasMinimumFundsToCancel`, `hasMinimumFundsToSpeedUp` | on the account's write portfolio: `estimateTransactionFee` (`REPLACE_SPEEDUP`, `networkParams.accountOptions.replaceTxId`), `getChangeAddress`, `getAccountAddresses` |
| NEAR validators of the staking screens | `getValidators` |
| EVM validators of the staking screens (`useEvmStakingValidators`, `getValidators` of `families/evm/staking/logic`) | `getValidators`; their prefetch is a no-op (O10) |
| Sei association warning (`isSeiAccountUnassociated`) | the readiness of the account (`call` of the address precompile); no warning when the portfolio cannot make the call (O11) |
| EVM transaction of the swap live app (`custom.getTransactionByHash` of LLD and LLM, `getEvmTransactionByHash`) | `getTransactionInfo`; unsupported (G1), the synced operations answer (O12) |
| A4 | none: no registration until coin modules register (G4); the A4 read flag is ignored |

Three checks hold that rule ([parity](parity)):

- **Import boundary.** The `.oxlintrc.json` of live-common forbids, in `portfolio/**`, `assembly/**`,
  `chainReads.ts`, `familyReads.ts` and the families' `bridge/api.ts`, the imports named there: `@ledgerhq/live-network`,
  `@ledgerhq/coin-*/network*`, axios, undici, node `http`/`https`, ethers providers, the network reads of
  `@ledgerhq/coin-evm/staking` and `@ledgerhq/coin-evm/logic`, the coin module factories (`getCoinModuleApi`, the
  coin-module registry, the families' `coinModuleApi`), A4, the legacy chain reads, and `require`. A family's network
  reads of the legacy path go in its `bridge/legacyChainReads.ts` (and `legacyChainReads.ts` here), which the portfolio
  path never consults: only `chainReads.ts`, which switches paths, and the family's `bridge/api.ts`, which attaches its
  own, import them. The lint names entry points; a network read behind any other import is the no-bypass test's to
  catch.
- **No bypass** ([noBypass.test.ts](parity/noBypass.test.ts)). Each method of the local side runs in an
  `AsyncLocalStorage` scope. Outside one, the coin module, live-network, axios, `fetch`, ethers' `FetchRequest`, node
  `http`/`https` and the A4 client fail the test. Every row above runs in `local` and `hybrid` mode, A4 on for every
  network (the legacy control run reaches its client), for XRP, Tron, Stellar, Stacks, Cardano, Solana, Tezos, Cosmos,
  Hedera, NEAR, EVM (Ethereum, and Sei for staking) and bitcoin. In `local` mode no service is wired: a call reaching
  it would fail.
- **Parity** ([parity](parity)). The same fake coin module serves the legacy path and the local portfolio path. Syncs
  (from scratch, incremental, after a blacklist change, over an empty page carrying a cursor, over blocks sharing a
  date, under an operation history bound stopping the walk or cutting the stored history) give the same account
  field by field, from the same listings (the same pages, `limit` included). Writes give the same transaction, status (its
  errors of the same classes, a sanctioned bitcoin sender included), signed operation and broadcast, and the coin
  module receives the same arguments (Tron, Stellar, Stacks, Solana, Tezos, Cosmos, Celo, EVM, Hedera, NEAR, Cardano,
  XRP, bitcoin).

The account is registered `auto_derive` (its xpub) for a family with an account module binding (bitcoin), `static`
(its address) otherwise, served locally by `@ledgerhq/account-module-single-address` (with the family's `balanceOptions`). The local side
resolves token entries through the family's `getTokenFromAsset` (`resolveAsset`), asked once per asset per call and
shared with the shape. A family with a binding reads its fresh address and outputs through the portfolio, and its
family fields from the module state Ledger Wallet stores.

A sync or a scan registers the account where its mode says: locally in `local`, on both sides in `hybrid`, on the
service in `remote`. A `local` chain wires no service at all, though a url is configured: a call the router sends to
both sides (a portfolio, an account extension) answers from the local side alone. A family with a binding keeps its hidden local twin in `remote` mode too: the twin's state is
the only source of its fresh address and outputs. A write registers the account on the local side when the client writes
(`local`, `hybrid`), and nowhere otherwise: a `hybrid` write never calls the service.

The service answers whether it synchronized the account. Until it has, a read through the service would answer an
empty account: the local twin serves the reads instead (`hybrid`, and `remote` for a family with a binding), and a
`remote` account without one fails with `UNAVAILABLE` (retry once the service has synchronized it; a scan stops at the
first account it registers). An account the service failed to register fails.

### Read path

An address family's account is assembled as on the legacy path (`assembleAccountShape` in [../assembly](../assembly)),
from the portfolio's models ([models.ts](models.ts)) instead of the coin module:

- The balance entries rebuild the network's balance list exactly (`balance_index`, `asset_info`, the stake of the
  spendable entry, `StakeInfo.position`): native balance, partitions, staking resources or positions, and token
  sub-accounts as legacy builds them. Without those fields (the service), the stake-free native entries are the
  account's own balance, each stake a balance beside it, and tokens are keyed on `asset` with the service's `cal_id`.
- The operations are the ones this sync listed (`OperationView`s, every asset), neither optimistic nor seeded by
  Ledger Wallet, run through `listedOperations` and `adaptCoreOperationToLiveOperation`, then merged over the
  account's own (`mergeOps`). The value of a native fee-inclusive operation is the coin module's again (value minus
  fee); `feesPayer` passes.
- A single-address account resuming is seeded with the operations of the block of its newest operation only (not
  always its highest block: operations sharing a date are ordered by id), marked `details.ledgerWalletSeeded`
  (`isSeeded`): its module lists above that block, as legacy lists above the newest operation.
  Its module state carries the balances legacy validates with (reserve and pending spends locked, staking positions
  carved out of the native balance of a family that partitions it, tokens).
- The operation history bound applies as on the legacy path. Both paths resolve the bound of the currency
  (`resolveOperationHistoryBound`: `maxOperations`, and the `pageSize` of a family whose `limit` support is
  established). The single-address account module lists through `boundedListingModule` ([listing.ts](listing.ts)):
  its listing is the legacy walk (`walkListing`), answered to the module as one page. The bound's page size goes as
  `limit` on every page, NFT and failed-incoming operations are dropped per page before the bound counts them, the
  walk stops on the bound at a block boundary (giving way while a single block exceeds it), empty pages carrying a
  cursor are followed within their budget, and a cursor served twice fails the sync. The coin module therefore serves
  both paths the same pages, and the module stores the same operations. When the bound stopped the walk, the
  assembly treats the round as a sync from scratch, as legacy does: the stored operations are discarded, the token
  accounts keep their own state but not their stored operations, and the pending operations are not refreshed. On
  both paths, the assembly then keeps the newest `maxOperations` operations of the account and of each token account,
  whole transactions (`boundByTransaction`). When the service serves the reads, its listing is its own: only that
  store bound applies. A family with a binding (bitcoin) is not bounded, on either path.
- The family hooks read the chain through `portfolioChainReads`: an extension the portfolio does not serve keeps the
  stored value (family fields, readiness), as `familyReads` maps `ChainReadUnsupportedError`; token accounts then get
  no family metadata.
- The `syncHash` is `portfolio-<mode>-<tokens hash>[-<syncVersion>]`: switching a chain between the legacy path and a
  mode, or between modes, or changing the blacklisted tokens resyncs from scratch.
- A failed sync is told by `PortfolioAccount.error` and revived ([errors.ts](errors.ts)) as the class the family's
  coin module throws ([errorClasses.ts](errorClasses.ts)); a balance read the region refuses is
  `CurrencyRegionRestrictedError` when the currency checks it, as legacy: the account module reads the tip and the
  balances before it lists the operations, as legacy does. It fails the sync when the local side serves
  the reads; when the service does, it is logged (the hidden twin's failure is not visible through the router).
- A family with a binding gets the fields of legacy `getAccountModuleShape`: balance, every operation of its history,
  fresh address, `blockHeight` from `syncedHeight` of the stored state, and the binding's `accountFields` (outputs
  through `getAccountUtxos`, none when unsupported).

### Write path

- Every write call goes through the side writing for the chain (the local side, or the service in `remote` mode), on
  one portfolio opened for the call ([intentApi.ts](intentApi.ts)); nothing goes to the coin module around it.
- When the client writes, the intent view carries the asset (`assetInfo`, native included) and the intent type
  (`intentType`), and `networkParams` holds every other field of the coin module intent as it is (data, memo,
  sequence, staking fields, account options), which `@ledgerhq/portfolio-module-local` spreads into the intent it
  hands to the modules: token and staking intents are written as on the legacy path. The fee options ride
  `networkParams.feeParameters` wherever the legacy path passes some (estimate, validation, craft), even empty, and
  never for a send-max estimate. Ledger Wallet leaves the `data` of an intent undefined: the local side's coin module,
  or the account module, completes it when it gets the intent, so a signature's data is crafted from the intent that
  carries the device key and the sequence (the legacy path crafts it before setting them; no coin module's
  `craftTransactionData` reads either).
- The client runs the nonce step of an address family as on the legacy path, the network sequence coming from the side
  writing (`getNextSequence`) in every mode.
- The local side validates (`validateTransaction`) against the balances Ledger Wallet seeds its state with: the
  reserve and the pending spends locked, the staking positions, the tokens, as the legacy path validates. Its errors
  are revived as the class the family's coin module throws.
- When the service writes, `networkParams` is sent in its wire form: maps as objects, bytes as hex, BigNumbers as
  decimal strings, then JSON safe. Any other set or typed array fails.
- The local side answers the operation its account module crafted in `details.operation`: the pending operation of a
  family with a binding is completed from it (bitcoin inputs, RBF).

## Limitations

In `local` and `hybrid` mode, a portfolio-enabled chain does what the legacy path does, except for the capabilities
the packages below it do not ship yet, and the accepted differences.

### `remote` mode

The service serves what its API defines, and no extension:

- Family fields and readiness keep their stored values (a new account has none); cosmos redelegations are reset to
  none; Solana token accounts lose their frozen state and Token-2022 extensions; an address family gets no fresh
  address nor outputs from the service.
- A family served by an account module (bitcoin) cannot send: its account key is an xpub, and the service writes from
  a single address. Its estimate and craft are refused (the status stays unvalidated); use `hybrid`.
- Staking intents and token transfers (a Cardano token included) are refused: the service's intent carries a plain
  native transfer only.
- The service serves no validation: `getTransactionStatus` answers an unvalidated status (no error, no warning, the
  fee the client set, 0 without one, the intent's amount, plus that fee for the native asset), so nothing blocks the
  send before the service crafts it.
- The service broadcasts without the broadcast config (e.g. MEV protection) and answers no crafted operation: the
  pending operation is the generic one, and the details it answers are kept only when they are an object (an
  `operation` among them is one of its details). Address validation goes without the network id.
- Raw signing fails with `METHOD_NOT_ALLOWED` (no `encodeRawTransaction`); a scan through an address lookup (Hedera)
  fails, the service looking no address up.
- The bitcoin replacement reads (edit patch, change and own addresses) fail with `NOT_FOUND`: a write registers no
  local twin. The EVM gas options throw "No gas tracker found" when the service's estimate carries none. The EVM token
  allowance fails with `METHOD_NOT_ALLOWED` (no `call`). The Sei association warning is not shown (no `call`).

### Capabilities not shipped yet

The portfolio layer exposes them; local answers `METHOD_NOT_ALLOWED` until the package ships the capability, and the
bridge reads that as an absent value. Never a call around the layer.

- **G1** coin-evm looks no transaction up (`getTransactionInfo`): on an explorer-less EVM chain a pending operation is
  not refreshed and stays pending until its retention window ends, and such a chain lists no history. Do not enable
  the portfolio layer for those chains until then. The swap live app's transaction is answered from the synced
  operations meanwhile, and carries no nonce, gas used nor gas price on the portfolio path (the portfolio's
  transaction has none).
- **G2** coin-evm reports no redelegation in its account metadata: the redelegations of an EVM chain are those decoded
  from the calldata cached on stored operations only (Sei's REST ones are missing).
- **G3** without G1, the EVM broadcast pre-check skips its "already mined or known" check (the nonce check stays, the
  node rejects a duplicate itself), and the confirmation check reads the synced operations.
- **G4** no coin module registers with A4 yet: the A4 indexer does not learn portfolio-enabled accounts.
- **B1** the account module reads the balances with the family's `balanceOptions` as they are: no `knownAssets` nor
  `scanAssetsMinHeight`, which the legacy path adds when it resumes, so the token scan starts from height 0 on every
  sync (slower on an EVM account with a long token history, same balances). Nor does it read again the balance of a
  token first received between its balance read and its listing, as the legacy path does: that token gets its token
  account on the next sync, without the row of that transfer, which sits below the watermark.
- **S1** no sponsored fee (Tron energy rental): `getSponsoredCoinApi` answers `null`.
- **V1, V2** the directory metadata of the staking screens (Tezos bakers, Tron super representatives and account names,
  Hedera validators, Cardano pools, Solana validators-app, Stacks PoX info) keeps its own reads until validator details
  and a network-info read exist in the portfolio models.
- **O13** the dYdX USDC rewards of the LLM cosmos balance footer (`CosmosAPI.getUsdcRewards`) keep their own read: the
  portfolio models carry no reward of another asset.

### Accepted differences

- Operations sharing a date take one order on both paths (newest first, then by coin module id), which may differ
  from the former legacy behaviour. Both paths list past an empty page carrying a cursor (the bounded walk counts a
  run of them against its empty-page budget, never against `maxOperations`), and fail on a cursor served twice.
- When a family read and a read of the sync (tip, balances, operations) fail together, the error reported may differ:
  legacy runs the family reads beside the tip and the balances, before the operations; the portfolio path syncs first
  (tip and balances, then the operations), then runs them.
- A staking position's details holding a bigint on the legacy path hold its decimal string here; both serialize the
  same.
- Errors are revived from their JSON form: same class, name, message and fields; a field type no reviver declares
  stays in its JSON form.
- The bitcoin replacement estimate is one estimate of the completed replacement instead of two; the EVM legacy
  pre-check reads the block of a mined transaction (one more request, same outcome).

### Others

- One service portfolio per account (`<portfolioId>:<account id>`): the service links no account to the registration
  that brought it, so a shared portfolio cannot tell two accounts of a network apart.
- A scan in `hybrid` or `remote` mode registers every account it reads on the service, empty ones included.
