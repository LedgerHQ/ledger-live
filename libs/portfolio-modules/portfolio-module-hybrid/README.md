# @ledgerhq/portfolio-module-hybrid

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept of ADR-064 Option 1; API may change. Destined for LedgerHQ/coin-modules.

A `PortfolioApi` (from `@ledgerhq/portfolio-module-framework`) served by two implementations of it:
a **local** one (portfolios kept by the client, accounts served by local account modules) and a
**remote** one (the portfolio-service). The client codes against one `PortfolioApi` whatever side
serves each network.

## Why

The portfolio-service does not serve every network, and it cannot craft UTXO transactions at
account level: its write API takes a single sender address, with no UTXO listing nor fresh or change
address. Reads can come from the service; writes for those networks must stay local.

## Routing

Each side's networks come from its `listNetworks()`, loaded on first need and cached per side (a
failed load is retried on the next call).

| Operation | Default | Override |
| --- | --- | --- |
| `addRegistrations` | remote when it serves the registration's network, else local | `routeRegistration` |
| `getLastBlock`, `getValidators`, `validateAddress`, `getNextSequence` | remote when it serves the network, else local | `routeRead` |
| `estimateTransactionFee`, `encodeTransaction`, `combineTransaction`, `broadcastTransaction` | local when it serves the network, else remote | `routeWrite` |

A registration's network is `ethereum` for `evm`, `solana` for `solana`, its `network` otherwise.

The other operations span both sides:

- `createPortfolio` creates on both; `getPortfolio` merges both (registrations and accounts
  concatenated, local first). A side answering `NOT_FOUND` counts as empty; both → `NOT_FOUND`.
- `removeRegistrations` and `addAddresses` go to the side whose portfolio holds the id. Unknown
  registration ids are ignored; an unknown account is `NOT_FOUND`.
- `listNetworks` is the deduplicated union. `sync(portfolioId)` runs the local side's `sync` when it
  has one.

## Pagination

`getUpdates`, `getPortfolioBalance` and `getPortfolioBalanceHistory` read one page of each side,
each with its own token, and pass every other query field through. An `account` filter reads only
the side owning the account; a `network` filter only the sides serving it.

- The hybrid `nextToken` is base64url JSON `{ local?: string | null; remote?: string | null }`:
  `null` once a side is exhausted. No token starts both sides; no `nextToken` means both are done.
  A malformed token is `BAD_REQUEST`.
- A page holds up to `size` items **per side**.
- Updates of a page are sorted by `time` following `order` (default `DESC`). The ordering holds
  within a page, not across pages: a later page of one side can hold items more recent than the
  previous page of the other.
- Balance and history pages are concatenated, local then remote.
- A side answering `NOT_FOUND` counts as exhausted, unless every side read answers it.

## Interface

Full declarations: [src/types.ts](src/types.ts).

```ts
function createHybridPortfolio(config: HybridPortfolioConfig): HybridPortfolioApi;

type HybridPortfolioConfig = {
  local: PortfolioApi & { sync?: (portfolioId: string, options?: SyncOptions) => Promise<unknown> };
  remote: PortfolioApi;
  routeRegistration?: RouteRegistration; // default: defaultRouteRegistration
  routeRead?: RouteNetwork;              // default: defaultRouteRead (remote first)
  routeWrite?: RouteNetwork;             // default: defaultRouteWrite (local first)
};

type HybridPortfolioApi = PortfolioApi & { sync(portfolioId: string, options?: SyncOptions): Promise<void> };

type Side = "local" | "remote";
type SideNetworks = Record<Side, Network[]>; // what each side's listNetworks answers
type SyncOptions = { signal?: AbortSignal };
type RouteRegistration = (registration: RegistrationInput, networks: SideNetworks) => Side;
type RouteNetwork = (network: Network, networks: SideNetworks) => Side;

// Routing building blocks
const preferRemote: RouteNetwork;
const preferLocal: RouteNetwork;
function registrationNetwork(registration: RegistrationInput): Network; // evm → ethereum, solana → solana
```

```ts
const portfolio = createHybridPortfolio({ local, remote });
await portfolio.createPortfolio("main");
await portfolio.addRegistrations("main", [{ type: "auto_derive", network: "bitcoin", xpub }]);
await portfolio.sync("main");
```
