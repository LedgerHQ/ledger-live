import type {
  AccountDescriptor,
  AccountModuleApi,
  HistoryStore,
  Versioned,
} from "@ledgerhq/account-module-framework";
import type { CoinModuleApi } from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import type {
  AccountStatus,
  Network,
  PortfolioAccount,
  PortfolioApi,
  Registration,
  RegistrationType,
} from "@ledgerhq/portfolio-module-framework";

/** A network served locally, and how a registration on it becomes an account. */
export type LocalNetwork = {
  currencyId: string;
  context: Context<any>;
  coinModule: CoinModuleApi<any, any, any>;
  accountModule: AccountModuleApi<any>;
  /** Account derivation of the registrations that carry only a key (xpub, address). */
  derivationMode: string;
  /** Account level, e.g. "84'/0'/0'". */
  derivationPath: string;
  nativeAsset: { name: string; ticker: string; decimals: number };
  /** e.g. ["auto_derive"] for bitcoin, ["static", "evm"] for ethereum. */
  registrationTypes: RegistrationType[];
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
  /** Why the registration, or the last sync, failed. */
  error?: string;
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

export type LocalPortfolioApi = PortfolioApi & {
  /** Brings every account served locally up to date; the service does it on its own. */
  sync: (portfolioId: string, options?: { signal?: AbortSignal }) => Promise<PortfolioAccount[]>;
};
