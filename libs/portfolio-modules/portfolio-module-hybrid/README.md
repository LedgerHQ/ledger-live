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

## Mode per network

Each chain sets its mode in its coin config (`config_currency_<id>`): `portfolio: { mode }`, `local`
when absent or unknown ([framework README](../../portfolio-module-framework/README.md)). Every
operation asks `modeOf` once per network it meets, so a mode switched remotely applies from the next
call. A lookup that fails or answers no known mode counts as `local` (`DEFAULT_PORTFOLIO_MODE`).

| Mode | Registered on | Portfolio and network reads | Writes |
| --- | --- | --- | --- |
| `local` | local | local | local |
| `remote` | remote | remote | remote |
| `hybrid` | both, the local registration a hidden twin | remote | local |

Portfolio reads: `getPortfolio` items, `getUpdates`, `getPortfolioBalance`, `getPortfolioBalanceHistory`.
Network reads: `getLastBlock`, `getValidators`. Writes: `validateAddress` and `getNextSequence` (a
recipient and a sequence are write inputs), `estimateTransactionFee`, `encodeTransaction`,
`combineTransaction`, `broadcastTransaction`. A registration's network is `ethereum` for `evm`,
`solana` for `solana`, its `network` otherwise.

The client builds `modeOf` from its coin configs. The service's network ids may differ from the
client's currency ids, so `coinConfigOf` maps one to the other:

```ts
const portfolio = createHybridPortfolio({
  local,
  remote,
  modeOf: portfolioModesFromCoinConfig(network => coinConfigOf(network)),
});
```

**Hidden twin.** The local registration of a `hybrid` network is never answered: `local.sync` (run by
`sync`) keeps it up to date so local writes craft with the account's own inputs and change. An item
of a side (registration, account, update, balance, history point) is visible only when its network
reads from that side. Removing a hybrid registration removes its twin, matched by type, network and
keys (xpub; address; static addresses and cardano credentials as sets), after the remote removal
succeeds, unless another remote registration with the same identity stays.

## Portfolio operations

- `createPortfolio` creates on both sides; `getPortfolio` merges both, visible items only
  (registrations and accounts concatenated, local first). A side answering `NOT_FOUND` counts as
  empty; both → `NOT_FOUND`.
- `addRegistrations` sends each registration to the sides of its mode and reads a side given none.
- `removeRegistrations` removes each id on the side whose visible registrations hold it; other ids
  are ignored. `addAddresses` goes to the side whose visible accounts hold it, else `NOT_FOUND`.
- `listNetworks` is the deduplicated union. `sync(portfolioId)` runs the local side's `sync`.

## Extensions

The [extension methods](../../portfolio-module-framework/README.md#extensions) are routed on what
each side serves, never retried on the other side after a failure. One no side serves answers
`METHOD_NOT_ALLOWED` (`isUnsupported`).

| Extension | Served by |
| --- | --- |
| `getAccountInfo`, `call`, `getAddressesForPublicKey`, `getTransactionInfo` | the read side when it serves it, else the write side |
| `validateTransaction`, `encodeRawTransaction` | the write side |
| `getFreshAddress`, `getChangeAddress`, `getAccountAddresses`, `getAccountUtxos` | the side whose portfolio holds the account, a hidden twin included: the local side is asked first, the remote one only when the local side does not hold it; `NOT_FOUND` when none does |

So a `hybrid` network keeps today's coverage while the service serves none: family reads, the
address lookup and `call` come from the local write side. In `remote` mode both sides are the
service: network and write extensions are absent. An account extension reaches a local twin by its
own id (the client's account id, distinct from the service's), in `remote` mode too when the client
keeps one. Extension fields of portfolios, balances and updates pass through unchanged.

## Pagination

`getUpdates`, `getPortfolioBalance` and `getPortfolioBalanceHistory` read one page of each side,
each with its own token, pass every other query field through, and keep each side's visible items.
An `account` filter reads the side holding it visibly (none → `NOT_FOUND`); otherwise a `network`
filter reads its network's read side.

- The hybrid `nextToken` is base64url JSON `{ local?: string | null; remote?: string | null }`:
  `null` once a side is exhausted. No token starts every side read; no `nextToken` means every side
  read is done. A malformed token is `BAD_REQUEST`.
- A page holds up to `size` items **per side**, fewer once hidden items are dropped.
- Updates of a page are sorted by `time` following `order` (default `DESC`), within a page only.
- Balance and history pages are concatenated, local then remote.
- A side answering `NOT_FOUND` counts as exhausted, unless every side read answers it.

## Limits

- A registration whose network changes mode later is not migrated: its items become hidden.
- An `evm` registration takes the mode of `ethereum` for routing although its accounts span EVM
  networks; its items are still filtered per item network.
- `addAddresses` does not follow to a hybrid twin.
- Registering on two sides is not atomic: one side can fail after the other succeeded. Removing a
  hybrid registration is not either: a local removal failing after the remote one leaves its twin
  hidden but synced.

## Interface

Full declarations: [src/types.ts](src/types.ts).

```ts
function createHybridPortfolio(config: HybridPortfolioConfig): HybridPortfolioApi;

type HybridPortfolioConfig = {
  local: PortfolioApi & { sync?: (portfolioId: string, options?: SyncOptions) => Promise<unknown> };
  remote: PortfolioApi;
  modeOf?: ModeOf; // default: DEFAULT_PORTFOLIO_MODE ("local") for every network
};
type ModeOf = (network: Network) => PortfolioMode | Promise<PortfolioMode>;
type HybridPortfolioApi = PortfolioApi & Required<Pick<PortfolioApi, ExtensionMethod>> & {
  sync(portfolioId: string, options?: SyncOptions): Promise<void>;
};
type Side = "local" | "remote";
type SyncOptions = { signal?: AbortSignal };

// Routing building blocks
function registrationNetwork(registration: RegistrationInput | Registration): Network;
function registrationSides(mode: PortfolioMode): readonly Side[]; // hybrid → both
function readSide(mode: PortfolioMode): Side; // local → local, else remote
function writeSide(mode: PortfolioMode): Side; // remote → remote, else local
```
