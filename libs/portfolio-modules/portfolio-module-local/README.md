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

/** The PortfolioApi with every extension served, plus the sync the service runs on its own. */
type LocalPortfolioApi = PortfolioApi & Required<Pick<PortfolioApi, ExtensionMethod>> & {
  sync(portfolioId: string, options?: { signal?: AbortSignal }): Promise<PortfolioAccount[]>;
};

/** A network served locally, and how a registration on it becomes an account. */
type LocalNetwork = {
  currencyId: string;
  context: Context<any>;
  // `supports` is the one coin-module-framework's withDefaults attaches: local's capability test
  coinModule: CoinModuleApi<any, any, any> & CoinModuleExtensions & { supports?: (method: OptionalApiKey) => boolean };
  accountModule: AccountModuleApi<any>;     // where the portfolio layer delegates to the account layer
  derivationMode: string;                   // account derivation of registrations that carry only a key
  derivationPath: string;                   // account level, e.g. "84'/0'/0'"
  nativeAsset: { name: string; ticker: string; decimals: number };
  registrationTypes: RegistrationType[];    // e.g. ["auto_derive"] for bitcoin, ["static", "evm"] for ethereum
  resolveAsset?: (asset: AssetInfo) => Promise<ResolvedAsset | undefined>; // the client's catalog lookup
  balanceOptions?: BalanceOptions;          // handed to getBalance when local reads a coin sender's balances
};

/** Coin module capabilities beyond coin-module-framework@10, until it declares them. */
type CoinModuleExtensions = {
  getAddressesForPublicKey?: (context, publicKey: string) => Promise<string[]>;
  getTransactionInfo?: (context, hash: string) => Promise<TransactionInfo | undefined>; // no module yet
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
  state?: Versioned;              // backs the account module's state store; absent until its first put
  error?: string;                 // why the registration, or the last sync, failed: its message
  failure?: ErrorView;            // why the last sync failed, JSON form; cleared by a successful sync
};
type AccountRef = { portfolioId: string; accountId: string };
```

`toCoinIntent`, `toAccountIntent`, `intentAssetOf`, `intentTypeOf`, `feeParametersOf` and `parseAmount` map the
service intent (see the write path below). `findAccount` lets the write path find the account that sends a transaction.

## From registrations to account modules

**One portfolio account is exactly one account of an account module.** The account layer is one Ledger Wallet account. That account may own many addresses, as a UTXO xpub account does, and it walks them itself. The portfolio layer is cross-chain: it brings together accounts across networks, and never composes addresses itself.

A served account carries one `AccountDescriptor`: the network's `currencyId`, `derivationMode` and `derivationPath`, index 0, and the registration key. It also carries one versioned state. Its account module gets a `StateStore` on it: `get` reads the `state` of the latest stored version of the account, and `put` writes it back through the `PortfolioStore`: a read-modify-write of the portfolio, like every account update of local.

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

The extension fields and methods, and what their entries mean, are described once in the
[framework README](../../portfolio-module-framework/README.md#extensions). Here is how local serves them.

- **Sync is explicit.** `sync(portfolioId, { signal })` runs the account module sync of every account served locally to completion; the module puts the account state through its state store. It is the only refresher of an account: local reads its account module (balances, addresses, outputs) without `refresh`, so they make no network call and serve what the last sync stored (their `updatedAt` is not surfaced). A failing account keeps the last state its module put, and records its `error` message and its `failure` (`ErrorView`) and the sync moves on to the next account; a successful sync clears both. The status becomes `registration_failure` only if the account was never synchronized. `PortfolioAccount.error` is the `failure`, else an `Error` of the message.
- **Failures in JSON form** (`ErrorView`): name, message, the error's own fields in JSON form and up to three `Error` causes. Functions, undefined values, fields longer than 4096 characters of JSON, circular ones and `config`, `request`, `response`, `headers`, `stack` are dropped, so an HTTP client's headers and keyed URLs never reach the store.
- **Indexer registration.** Once a `static` registration of a locally served network is stored, its address is handed to the coin module's `register` when `supports("register")` says so: fire and forget, a rejection logged through the network's context. A client registering its account on every sync registers it once per sync.
- **No fiat values.** `currency` is ignored, and `fiat_value` is never set.
- **Balances** are, per account, the balances its account module returns, in its order (`balance_index`). Each balance has a spendable entry and, when part of it is locked, a `locked: true` entry. Every entry is `confirmed` and not `estimated`, and names its asset in `asset_info` (type, reference, issuer). A token's `cal_id`, name, ticker and decimals come from `resolveAsset` (one lookup per asset per read), else from the asset's own name and unit; the native asset's from `nativeAsset`. The stake of a balance rides its spendable entry: `activating` and `active` become `active`, `deactivating` becomes `unstaking`, `withdrawable` and `inactive` become `inactive`; `position` keeps its five states, actions, asset, details and the fields the chain `reported`.
- **Balance history** is computed per account and asset, backwards from the current balance through the account history, its metadata resolved as the balances'. `IN` and rewards add their value, `NONE` adds nothing, and any other type subtracts its value. A failed operation subtracts only its fee, and only from the native asset. Points fall on step boundaries, and the last one is now:

  | Range | Window | Step |
  | --- | --- | --- |
  | `hour` | 1 hour | 5 minutes |
  | `day` (default) | 1 day | 1 hour |
  | `week` | 7 days | 6 hours |
  | `month` | 30 days | 1 day |
  | `year` | 365 days | 7 days |
  | `all` | Since the oldest operation | 1 day, or longer so that at most 365 step boundaries precede now (366 points at most, counting now) |

- **Updates** answer each operation as an `OperationView` (the account module's `JsonOperation`).
- **Write path.** The service intent becomes a coin `TransactionIntent`. `amount`, `customFees` and `sequence` are parsed as bigints, `intentType` defaults to `transaction`. The asset is `assetInfo` (its key must be `asset`), the native asset for `native` or none, else the one balance of the local sender keyed `asset`: a token needs `assetInfo` otherwise (`BAD_REQUEST`). An object `networkParams` is spread into the intent first, in memory as sent (bigint sequence, Map memos, Buffer data), so it carries network-specific fields but cannot override the common ones. Its `feeParameters` object is not spread: with the intent's `feesStrategy`, it reaches the modules as fee options, present exactly when one of them is (`customFeesParameters` of an estimate, `customFees.parameters` of a craft or validation with `customFees`).
  - When the sender is the key of a local account, the transaction goes through the account module: it completes `data`, crafts with the account's own inputs and change, `encodeTransaction` answers the optimistic operation it crafted in `details.operation` (JSON), and its broadcast records that operation.
  - Other senders go to the coin module directly, an undefined `data` completed by its `craftTransactionData`.
  - `validateTransaction` checks a local account's intent against the balances of its stored state (pending spends are the client's to write into that state), another sender's against `getBalance` (with `balanceOptions`); errors and warnings answer as `ErrorView`s.
  - `encodeRawTransaction` wraps a transaction built elsewhere through `craftRawTransaction`, at the sequence sent or the network's next one; `broadcastTransaction` hands `broadcastConfig` to the module that broadcasts.
- **Account reads** (`getFreshAddress`, `getChangeAddress`, `getAccountAddresses`, `getAccountUtxos`) come from the account module: `NOT_FOUND` for an unknown account, `BAD_REQUEST` for one not served locally, `METHOD_NOT_ALLOWED` for a read the module lacks (a single-address account has no change address nor outputs).
- **Capabilities.** `getValidators`, `call`, `getNextSequence`, `encodeRawTransaction` and a coin sender's validation answer `METHOD_NOT_ALLOWED` when the coin module lacks the method or its `supports` says so; `getAddressesForPublicKey` and `getTransactionInfo` when the coin module has no such extension. `getAccountInfo` answers `{ type: "none" }` when the module reports nothing more. `validateAddress` passes its `parameters` (`networkId`) to the coin module.
- **Pagination tokens** are offsets.
