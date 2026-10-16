# @ledgerhq/portfolio-module-portfolio-service

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept of ADR-064 Option 1; API may change. Destined for LedgerHQ/coin-modules.

The `PortfolioApi` of [`@ledgerhq/portfolio-module-framework`](../../portfolio-module-framework) served by the portfolio-service backend (OpenAPI 0.3.0-rc.3): one HTTP call per operation, no cache and no local state.

## Scope

Each `PortfolioApi` method calls the route of the matching operation id (`getPortfolio` → `GET /v1/portfolio/{portfolio_id}`, `broadcastTransaction` → `POST /v1/{network}/transaction/broadcast`, ...). Path segments are URL-encoded, undefined query parameters are left out, request and response bodies are the service's JSON.

A non-2xx response rejects with a `PortfolioApiError`: its `type` is the body's `type` when the framework knows it, otherwise the one of the HTTP status (`INTERNAL_ERROR` for any unlisted status); its `message` is the body's `message` (else the HTTP status text, else `Portfolio service answered <status>`) and its `details` is the body's `details` when that is a non-empty string. A failed `fetch` rejects with its own error.

## Extensions

The client serves none of the framework's [extensions](../../portfolio-module-framework/README.md#extensions): the
optional methods are absent, so `requireExtension` answers `METHOD_NOT_ALLOWED` and a client reads them as unsupported.
No validation (`validateTransaction`) nor raw transaction wrapping (`encodeRawTransaction`) comes from the service: a
client decides what a send does without them.

Request bodies carry the service's fields only:

- an intent (`estimateTransactionFee`, `encodeTransaction`) loses `assetInfo` and `intentType`; a `staking` intent is
  refused with `BAD_REQUEST` before any call, since the service would craft a plain transfer;
- `networkParams` is sent as given: the caller builds its wire form (decimal strings, JSON memos and data), the
  service cannot take the in-memory form a local portfolio does;
- `broadcastTransaction` sends `signedTransaction` alone (no `broadcastConfig`), `combineTransaction` its three
  fields, `validateAddress` the address alone (no `networkId`).

## Interface

Full declarations: [src/types.ts](src/types.ts).

```ts
function createPortfolioServiceClient(config: PortfolioServiceClientConfig): PortfolioApi;
function serviceIntent(intent: TransactionIntentView): TransactionIntentView; // the service's fields only

type PortfolioServiceClientConfig = {
  baseUrl: string;                 // the service instance; the caller picks it, none is hardcoded
  fetch?: typeof fetch;            // globalThis.fetch by default
  headers?: PortfolioServiceHeaders | (() => Promise<PortfolioServiceHeaders>); // a provider is called before each request
};
type PortfolioServiceHeaders = Record<string, string>;
```

```ts
const portfolio = createPortfolioServiceClient({
  baseUrl: "https://portfolio-service.api.ledger-test.com",
  headers: async () => ({ authorization: `Bearer ${await getToken()}` }),
});
```

## Assumptions

The spec types the pages of `/balance` and `/balance/history` as a generic `PageView_T`. The client assumes `/balance` pages carry `AccountBalances` items (`Success_A` / `Failure_A`) and `/balance/history` pages carry `BalanceHistoryPoint` items; the responses are not validated at runtime.
