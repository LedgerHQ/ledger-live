/**
 * The portfolio layer contract, shaped like the portfolio-service API (openapi 0.3.0-rc.3): one
 * method per operation id, the request and response bodies of the service. A client codes against
 * it once, whether its portfolio is served remotely, locally, or both.
 *
 * Field names follow the service, snake_case included.
 */

/** The main network identifier (`bitcoin`, `ethereum`, ...). */
export type Network = string;

export type Ordering = "ASC" | "DESC";

export type BalanceRange = "all" | "day" | "hour" | "month" | "week" | "year";

export type FeesStrategy = "fast" | "medium" | "slow";

export type AccountStatus =
  | "not_registered"
  | "registration_failure"
  | "synchronized"
  | "uninitialized";

/** An account of a portfolio (`Account1`). */
export type PortfolioAccount = {
  id: string;
  network: Network;
  status: AccountStatus;
};

/**
 * What a client registers (the request side of `addRegistrations`). The service discriminates on
 * `type` without declaring the values; these are the registration types it documents.
 */
export type RegistrationInput =
  /** A network and an address set the client maintains (`Account2`). */
  | { type: "static"; accountId: string; network: Network; addresses?: string[] }
  /** An extended public key whose addresses are derived (`AutoDerive1`: bitcoin-likes). */
  | { type: "auto_derive"; network: Network; xpub: string }
  /** Cardano credentials (`Cardano3`). */
  | {
      type: "cardano";
      accountId: string;
      network: Network;
      external?: string[];
      internal?: string[];
      stake?: string[];
    }
  /** One EVM address: one account per EVM network with activity (`Evm1`). */
  | { type: "evm"; address: string }
  /** A Solana main address, its token and stake accounts discovered (`Solana1`). */
  | { type: "solana"; address: string };

/** A registration of a portfolio (the response side), with the id the service assigned. */
export type Registration =
  | { type: "static"; id: string; network: Network; addresses?: string[] }
  | { type: "auto_derive"; id: string; network: Network; xpub: string }
  | {
      type: "cardano";
      id: string;
      network: Network;
      external?: string[];
      internal?: string[];
      stake?: string[];
    }
  | { type: "evm"; id: string; address: string }
  | { type: "solana"; id: string; address: string };

export type RegistrationType = Registration["type"];

export type Portfolio = {
  id: string;
  registrations?: Registration[];
  accounts?: PortfolioAccount[];
};

export type AddAddressesRequest =
  | { type: string; addresses?: string[] }
  | { type: "cardano"; external?: string[]; internal?: string[]; stake?: string[] };

/** A page of the service. A falsy `nextToken` means the stream is exhausted. */
export type PageView<T> = {
  items?: T[];
  nextToken?: string;
};

export type PageQuery = {
  size?: number;
  order?: Ordering;
  token?: string;
};

export type ReadFilter = {
  network?: Network;
  account?: string;
  asset?: string;
};

export type UpdatesQuery = PageQuery & ReadFilter & { address?: string };

export type BalanceQuery = PageQuery & ReadFilter & { currency?: string };

export type BalanceHistoryQuery = BalanceQuery & { range?: BalanceRange };

/** One account event (`UpdateView`). `operation` is the operation as the source describes it. */
export type UpdateView = {
  network: Network;
  accountId: string;
  operation: unknown;
  time: string;
  txHash: string;
};

export type StakeInfo = {
  address: string;
  delegate: string;
  state: "active" | "inactive" | "unstaking" | "withdrawn";
  amount: string;
  amount_deposited: string;
  amount_rewarded: string;
  state_updated_at?: string;
  created_at: string;
};

export type BalanceEntry = {
  network: Network;
  account_id: string;
  /** "native", or the asset reference (contract address, token id, ...). */
  asset: string;
  cal_id?: string;
  name: string;
  ticker: string;
  decimals: number;
  /** Base units, decimal string. */
  amount: string;
  fiat_value?: number;
  estimated: boolean;
  status: "confirmed" | "pending";
  locked: boolean;
  stake?: StakeInfo;
};

/**
 * The balances of one account (`Success_A`, `Failure_A`). The service types its balance pages as
 * a generic `PageView_T`; these are the item schemas it declares for them.
 */
export type AccountBalances =
  | { type: "success"; network: Network; account_id: string; items?: BalanceEntry[] }
  | { type: "failure"; network: Network; account_id: string; error: string };

export type BalanceHistoryPoint = {
  network: Network;
  account_id: string;
  asset: string;
  cal_id?: string;
  name?: string;
  ticker?: string;
  decimals?: number;
  time: string;
  /** Base units, decimal string. */
  value: string;
  fiat_value?: number;
};

/** A block (`Info`). */
export type BlockView = {
  height: number;
  hash?: string;
  time?: string;
  parent?: { height: number; hash?: string; time?: string };
};

export type ValidatorView = {
  address: string;
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  balance?: string;
  commissionRate?: string;
  apy?: number;
};

export type ValidatorsResponse = { items?: ValidatorView[]; next?: string };

/** The service's transaction intent: amounts as decimal strings, `networkParams` per network. */
export type TransactionIntentView = {
  type: string;
  sender: string;
  senderPublicKey?: string;
  recipient?: string;
  amount?: string;
  asset?: string;
  feesStrategy?: FeesStrategy;
  networkParams?: unknown;
};

export type EstimateTransactionFeeRequest = { intent: TransactionIntentView };
export type EstimateTransactionFeeResponse = { value: string; parameters?: unknown };
export type EncodeTransactionRequest = { intent: TransactionIntentView; customFees?: string };
export type EncodeTransactionResponse = { rawTransaction: string; details?: unknown };
export type CombineTransactionRequest = {
  rawTransaction: string;
  signature: string;
  pubkey?: string;
};
export type CombineTransactionResponse = { signedTransaction: string };
export type BroadcastTransactionRequest = { signedTransaction: string };
export type BroadcastTransactionResponse = { transactionId: string };

export type PortfolioApi = {
  // Portfolio
  getPortfolio: (portfolioId: string) => Promise<Portfolio>;
  createPortfolio: (portfolioId: string) => Promise<Portfolio>;
  addRegistrations: (portfolioId: string, registrations: RegistrationInput[]) => Promise<Portfolio>;
  removeRegistrations: (portfolioId: string, registrationIds: string[]) => Promise<Portfolio>;
  addAddresses: (
    portfolioId: string,
    accountId: string,
    request: AddAddressesRequest,
  ) => Promise<PortfolioAccount>;

  // Read
  getUpdates: (portfolioId: string, query?: UpdatesQuery) => Promise<PageView<UpdateView>>;
  getPortfolioBalance: (
    portfolioId: string,
    query?: BalanceQuery,
  ) => Promise<PageView<AccountBalances>>;
  getPortfolioBalanceHistory: (
    portfolioId: string,
    query?: BalanceHistoryQuery,
  ) => Promise<PageView<BalanceHistoryPoint>>;

  // Network
  listNetworks: () => Promise<Network[]>;
  getLastBlock: (network: Network) => Promise<BlockView>;
  getValidators: (network: Network, query?: { cursor?: string }) => Promise<ValidatorsResponse>;
  validateAddress: (network: Network, address: string) => Promise<{ valid: boolean }>;
  getNextSequence: (network: Network, address: string) => Promise<{ value: string }>;

  // Write
  estimateTransactionFee: (
    network: Network,
    request: EstimateTransactionFeeRequest,
  ) => Promise<EstimateTransactionFeeResponse>;
  encodeTransaction: (
    network: Network,
    request: EncodeTransactionRequest,
  ) => Promise<EncodeTransactionResponse>;
  combineTransaction: (
    network: Network,
    request: CombineTransactionRequest,
  ) => Promise<CombineTransactionResponse>;
  broadcastTransaction: (
    network: Network,
    request: BroadcastTransactionRequest,
  ) => Promise<BroadcastTransactionResponse>;
};

/** The error types of the service. */
export type PortfolioErrorType =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "UNAVAILABLE";
