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
  validateAddress(network: Network, address: string): Promise<{ valid: boolean }>;
  getNextSequence(network: Network, address: string): Promise<{ value: string }>;

  // Write
  estimateTransactionFee(network, request: { intent: TransactionIntentView }): Promise<{ value: string; parameters?: unknown }>;
  encodeTransaction(network, request: { intent: TransactionIntentView; customFees?: string }): Promise<{ rawTransaction: string; details?: unknown }>;
  combineTransaction(network, request: { rawTransaction: string; signature: string; pubkey?: string }): Promise<{ signedTransaction: string }>;
  broadcastTransaction(network, request: { signedTransaction: string }): Promise<{ transactionId: string }>;
};

type Portfolio = { id: string; registrations?: Registration[]; accounts?: PortfolioAccount[] };
type PortfolioAccount = {
  id: string; network: Network;
  status: "not_registered" | "registration_failure" | "synchronized" | "uninitialized";
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
};
```

Errors are `PortfolioApiError` (`status`, `type`, `details`; `isPortfolioApiError` narrows to it), with the service's
`PortfolioErrorType`s: `BAD_REQUEST`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `TOO_MANY_REQUESTS`, `INTERNAL_ERROR`,
`UNAVAILABLE`. `pageOf(items, query)` pages with an offset token, as the local implementation does (the hybrid one
encodes a cursor per side in its token).

The service types its `/balance` and `/balance/history` pages as a generic `PageView_T`; this contract reads them as
pages of `AccountBalances` (`Success_A` / `Failure_A`) and `BalanceHistoryPoint`, the item schemas the service declares.
