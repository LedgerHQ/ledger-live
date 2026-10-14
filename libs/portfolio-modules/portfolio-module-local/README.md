# @ledgerhq/portfolio-module-local

> [!CAUTION]
> **Status: UNSTABLE** — Proof of concept of ADR-064 Option 1; API may change. Destined for LedgerHQ/coin-modules.

## Scope

The `PortfolioApi` of `@ledgerhq/portfolio-module-framework` served locally. It has the same interface as the portfolio-service, so a client codes against one contract whether its portfolio is remote, local, or hybrid. The difference is where the work happens:

- the client keeps its portfolios, through a `PortfolioStore` it provides;
- each account is delegated to the `AccountModuleApi` of its network, which delegates the chain to a `CoinModuleApi`.

The package contains no blockchain-specific code and no Ledger Wallet types (no `types-live`, `bignumber.js` or `rxjs`).

## Interface

Full declarations: [src/types.ts](src/types.ts).

```ts
function createLocalPortfolio(config: LocalPortfolioConfig): LocalPortfolioApi;
function createMemoryPortfolioStore(): PortfolioStore;

type LocalPortfolioConfig = {
  networks: Record<Network, LocalNetwork>;
  store: PortfolioStore;
  generateId?: () => string; // registration ids; crypto.randomUUID by default
  now?: () => number;
};

/** The PortfolioApi, plus the sync the service runs on its own. */
type LocalPortfolioApi = PortfolioApi & {
  sync(portfolioId: string, options?: { signal?: AbortSignal }): Promise<PortfolioAccount[]>;
};

/** A network served locally, and how a registration on it becomes an account. */
type LocalNetwork = {
  currencyId: string;
  context: Context<any>;
  coinModule: CoinModuleApi<any, any, any>;
  accountModule: AccountModuleApi<any>;     // where the portfolio layer delegates to the account layer
  derivationMode: string;                   // account derivation of registrations that carry only a key
  derivationPath: string;                   // account level, e.g. "84'/0'/0'"
  nativeAsset: { name: string; ticker: string; decimals: number };
  registrationTypes: RegistrationType[];    // e.g. ["auto_derive"] for bitcoin, ["static", "evm"] for ethereum
};

/** The persistence of a local portfolio, provided by the client. */
interface PortfolioStore {
  get(portfolioId: string): Promise<StoredPortfolio | undefined>;
  put(portfolio: StoredPortfolio): Promise<void>;
  history(accountId: string): HistoryStore; // one per account
  findAccount(network: Network, key: string): Promise<AccountRef | undefined>; // matches descriptor.key
}

type StoredPortfolio = { id: string; registrations: Registration[]; accounts: StoredAccount[] }; // JSON safe
type StoredAccount = {
  id: string; network: Network; registrationId: string; status: AccountStatus;
  descriptor?: AccountDescriptor; // absent for an account not served locally
  state?: Versioned;              // absent until the first sync
  error?: string;                 // why the registration, or the last sync, failed
};
type AccountRef = { portfolioId: string; accountId: string };
```

`toCoinIntent(intent)`, `toAccountIntent(intent)` and `parseAmount(value, field)` map the service intent (see the write
path below). `findAccount` lets the write path find the account that sends a transaction.

## From registrations to account modules

**One portfolio account is exactly one account of an account module.** The account layer is one Ledger Wallet account. That account may own many addresses, as a UTXO xpub account does, and it walks them itself. The portfolio layer is cross-chain: it brings together accounts across networks, and never composes addresses itself.

A served account carries one `AccountDescriptor`: the network's `currencyId`, `derivationMode` and `derivationPath`, index 0, and the registration key. It also carries one versioned state.

| Registration | Accounts |
| --- | --- |
| `auto_derive { network, xpub }` | One account keyed by the xpub. The UTXO account module walks its addresses. Its id is `accountIdOf(descriptor)` (`js:2:<currency>:<xpub>:<derivation mode>`) |
| `evm { address }` | One account per network accepting `evm`, keyed by the address. This is the cross-chain part |
| `solana { address }` | One account on the `solana` network if it accepts `solana` |
| `static { accountId, network, addresses }` with exactly one distinct address | One account with id `accountId`, keyed by that address, served by a single-address account module |
| `static` with no address, or several | One account with status `registration_failure` and an `error`. An address set is an account of its own, which only an account module can serve |
| `cardano`, or a type the network does not serve | One account with status `registration_failure` and an `error`, without a descriptor. An `evm` or `solana` registration that no network serves is still recorded, but has no account |

New accounts are `uninitialized`. When an account id already exists in the portfolio, the existing account is kept. `removeRegistrations` removes the registrations and their accounts. `addAddresses` is always a `BAD_REQUEST` for a known account, since the account module manages addresses, and a `NOT_FOUND` for an unknown one.

## Differences with the remote service

- **Sync is explicit.** `sync(portfolioId, { signal })` runs the account module sync of every account served locally to completion, and persists its state. A failing account records its `error` and the sync moves on to the next account. The status becomes `registration_failure` only if the account was never synchronized.
- **No fiat values.** `currency` is ignored, and `fiat_value` is never set.
- **Balances** are, per account, the balances its account module returns. Each balance has a spendable entry and, when part of it is locked, a `locked: true` entry. Every entry is `confirmed` and not `estimated`. Stakes are not mapped.
- **Balance history** is computed per account and asset, backwards from the current balance through the account history. `IN` and rewards add their value, `NONE` adds nothing, and any other type subtracts its value. A failed operation subtracts only its fee, and only from the native asset. Points fall on step boundaries, and the last one is now:

  | Range | Window | Step |
  | --- | --- | --- |
  | `hour` | 1 hour | 5 minutes |
  | `day` (default) | 1 day | 1 hour |
  | `week` | 7 days | 6 hours |
  | `month` | 30 days | 1 day |
  | `year` | 365 days | 7 days |
  | `all` | Since the oldest operation | 1 day, or longer so that at most 365 step boundaries precede now (366 points at most, counting now) |

- **Write path.** The service intent becomes a coin `TransactionIntent`. `amount` and `customFees` are parsed as bigints. The `asset` is `native` or a token reference. An object `networkParams` is spread into the intent first, so it carries network-specific fields but cannot override the common ones. When the sender is the key of a local account, the transaction goes through the account module: it crafts with the account's own inputs and change, and its broadcast records the optimistic operation. Other senders go to the coin module directly.
- **Pagination tokens** are offsets.
