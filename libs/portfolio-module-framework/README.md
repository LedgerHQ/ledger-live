# @ledgerhq/portfolio-module-framework

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept of ADR-064 Option 1; API may change. Destined for LedgerHQ/coin-modules.

The contract of the portfolio layer: `PortfolioApi`, the cross-chain, client-facing API above the account layer. A
portfolio groups accounts of any network; each account is served by an account module
(`@ledgerhq/account-module-framework`), which delegates its chain to a coin module.

The contract is shaped like the portfolio-service REST API (openapi 0.3.0-rc.3): one method per operation id, the
request and response bodies of the service, its field names (snake_case included) and its error types. A client codes
against it once, whatever serves the portfolio:

- `@ledgerhq/portfolio-module-portfolio-service`: the portfolio-service backend;
- `@ledgerhq/portfolio-module-local`: the same API served by the client, its accounts delegated to local account
  modules;
- `@ledgerhq/portfolio-module-hybrid`: routed per network between the two.

## Interface

One method per operation id of the service; request and response bodies as the service defines them. Full declarations:
[src/types.ts](src/types.ts).

```ts
type PortfolioApi = {
  // Portfolio
  getPortfolio(portfolioId: string): Promise<Portfolio>;
  createPortfolio(portfolioId: string): Promise<Portfolio>;
  addRegistrations(portfolioId: string, registrations: RegistrationInput[]): Promise<Portfolio>;
  removeRegistrations(portfolioId: string, registrationIds: string[]): Promise<Portfolio>;
  addAddresses(portfolioId: string, accountId: string, request: AddAddressesRequest): Promise<PortfolioAccount>;

  // Read
  getUpdates(portfolioId: string, query?: UpdatesQuery): Promise<PageView<UpdateView>>;
  getPortfolioBalance(portfolioId: string, query?: BalanceQuery): Promise<PageView<AccountBalances>>;
  getPortfolioBalanceHistory(portfolioId: string, query?: BalanceHistoryQuery): Promise<PageView<BalanceHistoryPoint>>;

  // Network
  listNetworks(): Promise<Network[]>;
  getLastBlock(network: Network): Promise<BlockView>;
  getValidators(network: Network, query?: { cursor?: string }): Promise<ValidatorsResponse>;
  validateAddress(network: Network, address: string, parameters?: { networkId?: number }): Promise<{ valid: boolean }>;
  getNextSequence(network: Network, address: string): Promise<{ value: string }>;

  // Write
  estimateTransactionFee(network, request: { intent: TransactionIntentView }): Promise<{ value: string; parameters?: unknown }>;
  encodeTransaction(network, request: { intent: TransactionIntentView; customFees?: string }): Promise<{ rawTransaction: string; details?: unknown }>;
  combineTransaction(network, request: { rawTransaction: string; signature: string; pubkey?: string }): Promise<{ signedTransaction: string }>;
  broadcastTransaction(network, request: { signedTransaction: string; broadcastConfig?: BroadcastConfigView }): Promise<{ transactionId: string }>;

  // Extensions, optional (see below)
  getFreshAddress?, getChangeAddress?, getAccountAddresses?, getAccountUtxos?;      // account reads
  getAccountInfo?, call?, getAddressesForPublicKey?, getTransactionInfo?;           // network reads
  validateTransaction?, encodeRawTransaction?;                                      // writes
};

type Portfolio = { id: string; registrations?: Registration[]; accounts?: PortfolioAccount[] };
type PortfolioAccount = {
  id: string; network: Network;
  status: "not_registered" | "registration_failure" | "synchronized" | "uninitialized";
  error?: ErrorView; // extension
};

type RegistrationInput = // Registration: the same variants, with the `id` the service assigns in place of `accountId`
  | { type: "static"; accountId: string; network: Network; addresses?: string[] }
  | { type: "auto_derive"; network: Network; xpub: string } // bitcoin-likes
  | { type: "cardano"; accountId: string; network: Network; external?: string[]; internal?: string[]; stake?: string[] }
  | { type: "evm"; address: string }                         // one account per EVM network
  | { type: "solana"; address: string };

type AccountBalances =
  | { type: "success"; network: Network; account_id: string; items?: BalanceEntry[] }
  | { type: "failure"; network: Network; account_id: string; error: string };
type BalanceEntry = {
  network: Network; account_id: string; asset: string; // "native", or the asset reference
  cal_id?: string; name: string; ticker: string; decimals: number;
  amount: string; fiat_value?: number; estimated: boolean;
  status: "confirmed" | "pending"; locked: boolean; stake?: StakeInfo;
  asset_info?: ChainAssetView; balance_index?: number; // extensions
};
type BalanceHistoryPoint = { network: Network; account_id: string; asset: string; time: string; value: string; /* + metadata, fiat_value */ };
type UpdateView = { network: Network; accountId: string; operation: unknown; time: string; txHash: string };

type PageView<T> = { items?: T[]; nextToken?: string }; // falsy nextToken: exhausted
type UpdatesQuery = PageQuery & ReadFilter & { address?: string };
type BalanceQuery = PageQuery & ReadFilter & { currency?: string };
type BalanceHistoryQuery = BalanceQuery & { range?: "all" | "day" | "hour" | "month" | "week" | "year" };
// PageQuery = { size?, order?: "ASC" | "DESC", token? }; ReadFilter = { network?, account?, asset? }

type TransactionIntentView = {
  type: string; sender: string; senderPublicKey?: string; recipient?: string;
  amount?: string; asset?: string; feesStrategy?: "fast" | "medium" | "slow"; networkParams?: unknown;
  assetInfo?: AssetInfoView; intentType?: "transaction" | "staking"; // extensions
};
```

Errors are `PortfolioApiError` (`status`, `type`, `details`; `isPortfolioApiError` narrows to it), with the service's
`PortfolioErrorType`s: `BAD_REQUEST`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`,
`UNAVAILABLE`. `pageOf(items, query)` pages with an offset token, as the local implementation does (the hybrid one
encodes a cursor per side in its token).

## Extensions

What the service does not define, doc-commented `Extension (not in portfolio-service)` in [src/types.ts](src/types.ts):
optional fields and methods carrying what a client needs that the service form cannot say. The local implementation
serves them all, the hybrid one routes them, the portfolio-service client serves none and strips the extension fields
from its request bodies. Read models are JSON: amounts and sequences as decimal strings, dates as ISO strings.

- **Methods.** `requireExtension(api, name)` returns the method bound to `api`, or throws `METHOD_NOT_ALLOWED`;
  `isUnsupported(error)` is the one test of "not served" (a `PortfolioApiError` of type `METHOD_NOT_ALLOWED`, never a
  bare 405). A client reads an unsupported read as an absent value and fails an unsupported write explicitly.
  `EXTENSION_METHODS` lists them by group (account, network, write).
- **Balance entries.** `asset_info` names the asset as its chain does (`assetKeyOf(asset_info)` is the entry's
  `asset`: reference first, so Cardano tokens of type `native` keep their own key). `balance_index` is the position of
  the network balance an entry splits: its spendable and locked entries share it, so a client rebuilds the network's
  balance list exactly (the first native balance is the account's own). The stake of a balance rides its spendable
  entry only, so no client counts it twice.
- **Stakes.** `StakeInfo` keeps the service form (four states, defaulted fields); `position` carries the five states,
  `uid`, `actions`, the staked asset, `details`, and in `reported` the defaulted fields the chain did report.
- **Validators.** `ValidatorView.id` is the coin module's validator id, which a staking intent may name the
  validator by (`valId`); the address when the chain has no other.
- **Operations.** Local implementations answer `UpdateView.operation` as an `OperationView` (the account module's
  `JsonOperation`), with `feesPayer` and the structured `memo`; `PortfolioAccount.error` is the `ErrorView` of the last
  failed sync.
- **Intents.** `assetInfo` names the asset to send (local requires it for any asset but `native`); `intentType`
  defaults to `transaction`. `networkParams` carries the rest (`data`, `memo`, `useAllAmount`, `sequence`, `mode`,
  `valAddress`, `dstValAddress`, `valId`, `withdrawId`, `accountOptions`, `feeParameters`): local takes them in memory
  (bigint sequence, Map memos, Buffer data) and spreads them into the coin intent; the service takes their wire form.
- **Validation.** Local validation (`validateTransaction`) checks the intent against the balances of the account's
  stored state: pending spends are the client's concern, and a client that wants them locked writes them into the
  state it stores.

## Mode per chain

Which implementation serves a chain is set in its coin config (`config_currency_<id>`, the `CurrencyConfig` its coin
module reads), so it can be switched remotely chain by chain:

```ts
{ ...coinConfig, portfolio: { enabled: true, mode: "hybrid" } } // PortfolioCoinConfig; mode "local" when absent or unknown
```

`isPortfolioEnabled(coinConfig)` is true only for `enabled: true`: a client keeps its legacy path for the other chains
(Ledger Wallet's generic bridge, see `libs/ledger-live-common/src/bridge/generic-coin-framework/portfolio/README.md`).

| Mode | Registered on | Reads | Writes |
| --- | --- | --- | --- |
| `local` | the client's account modules | local | local |
| `remote` | portfolio-service | remote | remote |
| `hybrid` | both (the local copy stays hidden, synced for writes) | remote | local, crafted with the account's own inputs and change |

`portfolioModeOf(coinConfig)` reads it; `portfolioModesFromCoinConfig(coinConfigOf)` turns a coin config lookup into the
`modeOf(network)` resolver `@ledgerhq/portfolio-module-hybrid` routes with.

The service types its `/balance` and `/balance/history` pages as a generic `PageView_T`; this contract reads them as
pages of `AccountBalances` (`Success_A` / `Failure_A`) and `BalanceHistoryPoint`, the item schemas the service declares.
