import type {
  AccountDescriptor,
  AccountModuleApi,
  HistoryStore,
  Versioned,
} from "@ledgerhq/account-module-framework";
import type { OptionalApiKey } from "@ledgerhq/coin-module-framework/api/impl";
import type {
  AssetInfo,
  BalanceOptions,
  CoinModuleApi,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type {
  AccountStatus,
  ErrorView,
  ExtensionMethod,
  Network,
  PortfolioAccount,
  PortfolioApi,
  Registration,
  RegistrationType,
} from "@ledgerhq/portfolio-module-framework";

/** What the network knows of a transaction, in memory: a Date block time, bigint amounts. */
export type TransactionInfo = {
  hash: string;
  /** null while known but not in a block. */
  block: { height: number; hash: string; time: Date } | null;
  fee?: bigint;
  value?: bigint;
  sequence?: bigint;
  /** Input data (EVM calldata), hex. */
  data?: string;
};

/** Coin module capabilities beyond @ledgerhq/coin-module-framework@10's `CoinModuleApi`. */
export type CoinModuleExtensions = {
  /** The addresses a public key controls, on networks that hand addresses out (ADR-055). */
  getAddressesForPublicKey?: (context: Context<any>, publicKey: string) => Promise<string[]>;
  /** undefined when the network does not know the hash. No module implements it yet (G1). */
  getTransactionInfo?: (
    context: Context<any>,
    hash: string,
  ) => Promise<TransactionInfo | undefined>;
};

/** An unspent output as a UTXO account module answers it (account-module-utxo `Utxo`). */
export type AccountUtxo = {
  txid: string;
  vout: number;
  value: bigint;
  address: string;
  derivationPath: string;
  height: number | null;
  replaceable: boolean;
  change: boolean;
};

/** The catalog identity of an asset, as the client looks it up. */
export type ResolvedAsset = { cal_id: string; name: string; ticker: string; decimals: number };

/** A network served locally, and how a registration on it becomes an account. */
export type LocalNetwork = {
  currencyId: string;
  context: Context<any>;
  /**
   * `supports` is the one coin-module-framework's `withDefaults` attaches (its `instrumentApi`
   * copies it): local's capability test.
   */
  coinModule: CoinModuleApi<any, any, any> &
    CoinModuleExtensions & { supports?: (method: OptionalApiKey) => boolean };
  accountModule: AccountModuleApi<any>;
  /** Account derivation of the registrations that carry only a key (xpub, address). */
  derivationMode: string;
  /** Account level, e.g. "84'/0'/0'". */
  derivationPath: string;
  nativeAsset: { name: string; ticker: string; decimals: number };
  /** e.g. ["auto_derive"] for bitcoin, ["static", "evm"] for ethereum. */
  registrationTypes: RegistrationType[];
  /**
   * The client's catalog lookup of a non-native asset: fills `cal_id`, `name`, `ticker` and
   * `decimals` of balance entries and history points. Absent, undefined or rejected: the asset's own
   * name and unit, no `cal_id` (as the service does for an unlisted token).
   */
  resolveAsset?: (asset: AssetInfo) => Promise<ResolvedAsset | undefined>;
  /** Handed to `getBalance` wherever local reads a coin sender's balances (the account module has its own). */
  balanceOptions?: BalanceOptions;
};

/** A portfolio account: one account of the account module of its network. */
export type StoredAccount = {
  id: string;
  network: Network;
  registrationId: string;
  status: AccountStatus;
  /** Absent for an account not served locally. */
  descriptor?: AccountDescriptor;
  /** Absent until the first sync. */
  state?: Versioned;
  /** Why the registration, or the last sync, failed: its message. */
  error?: string;
  /** Why the last sync failed, in JSON form; absent once a sync succeeds. */
  failure?: ErrorView;
};

/** A portfolio as the client persists it. JSON safe. */
export type StoredPortfolio = {
  id: string;
  registrations: Registration[];
  accounts: StoredAccount[];
};

export type AccountRef = { portfolioId: string; accountId: string };

/** The persistence of a local portfolio, provided by the client. */
export interface PortfolioStore {
  get(portfolioId: string): Promise<StoredPortfolio | undefined>;
  put(portfolio: StoredPortfolio): Promise<void>;
  history(accountId: string): HistoryStore;
  /** The account whose descriptor key (xpub, address) is `key`, in any portfolio. */
  findAccount(network: Network, key: string): Promise<AccountRef | undefined>;
}

export type LocalPortfolioConfig = {
  networks: Record<Network, LocalNetwork>;
  store: PortfolioStore;
  /** Registration ids; `crypto.randomUUID` by default. */
  generateId?: () => string;
  now?: () => number;
};

export type LocalPortfolioDeps = Required<LocalPortfolioConfig>;

/** The `PortfolioApi` with every extension served. */
export type LocalPortfolioApi = PortfolioApi &
  Required<Pick<PortfolioApi, ExtensionMethod>> & {
    /** Brings every account served locally up to date; the service does it on its own. */
    sync: (portfolioId: string, options?: { signal?: AbortSignal }) => Promise<PortfolioAccount[]>;
  };
