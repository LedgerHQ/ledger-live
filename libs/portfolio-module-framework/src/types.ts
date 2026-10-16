/**
 * The portfolio layer contract, shaped like the portfolio-service API (openapi 0.3.0-rc.3): one
 * method per operation id, the request and response bodies of the service. A client codes against
 * it once, whether its portfolio is served remotely, locally, or both.
 *
 * Field names follow the service, snake_case included.
 *
 * What the service does not define is marked `Extension (not in portfolio-service)`: optional
 * fields and methods a client reads when an implementation serves them. Their names follow the
 * schema they extend: snake_case on the read models of the service (`BalanceEntry`, `StakeInfo`),
 * camelCase on `TransactionIntentView` and on the mirrors of coin-module-framework shapes
 * (`AssetInfoView`, `OperationView`, `UtxoView`, `TransactionInfoView`). Read models are JSON:
 * amounts and sequences as decimal strings, dates as ISO strings.
 */

/** The main network identifier (`bitcoin`, `ethereum`, ...). */
export type Network = string;

export type Ordering = "ASC" | "DESC";

export type BalanceRange = "all" | "day" | "hour" | "month" | "week" | "year";

export type FeesStrategy = "fast" | "medium" | "slow";

/** Extension (not in portfolio-service): a value JSON keeps as is. */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

/** Extension (not in portfolio-service). */
export type JsonObject = { [key: string]: JsonValue };

/**
 * Extension (not in portfolio-service): which asset, as its chain names it: its standard
 * (`native`, `trc10`/`trc20`, `hts`/`erc20`, `spl`, `esdt`...), reference and issuer. `asset` (a
 * string) keys an asset; this says which one. Coin modules need it to craft (Tron, Hedera,
 * Stellar, MultiversX), clients to find the token.
 */
export type ChainAssetView = { type: string; assetReference?: string; assetOwner?: string };

/**
 * Extension (not in portfolio-service): coin-module-framework `AssetInfo`, JSON form; name and
 * unit as the chain or the client gives them.
 */
export type AssetInfoView = ChainAssetView & {
  name?: string;
  unit?: {
    name: string;
    code: string;
    magnitude: number;
    showAllDigits?: boolean;
    prefixCode?: boolean;
  };
};

/** Extension (not in portfolio-service): a failure, in JSON form. */
export type ErrorView = {
  /** The error class name (`NotEnoughBalance`, `UnexpectedGetBalanceError`...). */
  name: string;
  message: string;
  /** HTTP status of this failure (its own; a cause carries its own). */
  status?: number;
  cause?: ErrorView;
  /** The error's own fields, JSON form. */
  [field: string]: JsonValue | ErrorView | undefined;
};

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
  /** Extension (not in portfolio-service): why the registration or the last sync failed; absent once a sync succeeds. */
  error?: ErrorView;
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

/**
 * One account event (`UpdateView`). `operation` is the operation as the source describes it: the
 * service's own format, or an `OperationView` from the local implementations.
 */
export type UpdateView = {
  network: Network;
  accountId: string;
  operation: unknown;
  time: string;
  txHash: string;
};

/**
 * Extension (not in portfolio-service): the account's balance change of one operation, as an
 * account module records it. The form local implementations answer `UpdateView.operation` in.
 */
export type OperationView = {
  /** The coin module's operation id. */
  id: string;
  hash: string;
  /** "IN", "OUT", "FEES", ... */
  type: string;
  /**
   * The change of the account's balance in `asset`, decimal string, as the account module computes
   * it: the fee alone for a failed operation; value + fee when the asset is native and `type` is
   * one of account-module-framework's `FEE_INCLUSIVE_OPERATION_TYPES` (OUT, FEES, DELEGATE,
   * UNDELEGATE, REDELEGATE, CONTRACT_CALL, UPDATE_ACCOUNT), whoever paid the fee; the coin module's
   * value otherwise (FREEZE, VOTE, OPT_IN... get no fee added).
   */
  value: string;
  /** Decimal string. */
  fee: string;
  asset: AssetInfoView;
  senders: string[];
  recipients: string[];
  /** Who paid the fee, when the chain says (`Operation.tx.feesPayer`). */
  feesPayer?: string;
  /** The coin module's `Operation.memo` (structured), JSON form. `details.memo` stays the module's own. */
  memo?: JsonValue;
  /** null while the transaction is not in a block. */
  block: { height: number; hash: string; time: string } | null;
  date: string;
  failed: boolean;
  /** Recorded by a broadcast, not seen on the network yet. */
  optimistic?: boolean;
  /** Module specific data, JSON form. */
  details?: JsonObject;
};

/** Extension (not in portfolio-service): the five states of a stake (coin-module-framework `Stake`). */
export type StakeState = "inactive" | "activating" | "active" | "deactivating" | "withdrawable";

/** Extension (not in portfolio-service): what a stake allows (coin-module-framework `Stake`). */
export type StakeAction = "delegate" | "redelegate" | "undelegate" | "claim_reward" | "withdraw";

/**
 * Extension (not in portfolio-service): what `StakeInfo` cannot say. `StakeInfo` keeps the service
 * form, which folds five states into four and defaults absent fields ("" delegate and creation
 * date, deposit = amount - rewards); `reported` lists the defaulted fields the chain did report,
 * so a client reads their values from `StakeInfo` and their presence from here.
 * (`state_updated_at` is already optional in `StakeInfo`: its presence is exact.)
 */
export type StakePositionView = {
  uid: string;
  state: StakeState;
  actions: StakeAction[];
  /** The staked asset (`Stake.asset`). */
  asset_info: AssetInfoView;
  reported: ("delegate" | "amount_deposited" | "amount_rewarded" | "created_at")[];
  /** Network specific fields, JSON form. */
  details?: JsonObject;
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
  /** Extension (not in portfolio-service): the stake as the network reports it. */
  position?: StakePositionView;
};

export type BalanceEntry = {
  network: Network;
  account_id: string;
  /** "native", or the asset reference (contract address, token id, ...). */
  asset: string;
  /** The catalog id of the asset: the service's, or the client's lookup on local implementations. */
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
  /** The local implementations put it on the spendable entry of a balance only (`locked: false`). */
  stake?: StakeInfo;
  /**
   * Extension (not in portfolio-service): the asset as its chain names it. Its name and decimals
   * are the entry's own `name`, `ticker` and `decimals`.
   */
  asset_info?: ChainAssetView;
  /**
   * Extension (not in portfolio-service): the position, in the network's order, of the balance
   * this entry splits. The spendable entry and the locked entry of one balance share it; the stake
   * of a balance is on its spendable entry only. A client rebuilds the network's balance list
   * exactly (the first native balance is the account's own).
   */
  balance_index?: number;
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
  /**
   * Extension (not in portfolio-service): coin-module-framework `Validator.id`, which a staking
   * transaction may name the validator by (the address when the chain has no other id).
   */
  id?: string;
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

/** Extension (not in portfolio-service): ADR-045 `AccountInfo`, JSON form; `{ type: "none" }` when the network reports nothing more. */
export type AccountInfoView = { type: string; [field: string]: JsonValue };

/** Extension (not in portfolio-service): an unspent output of a UTXO account (account-module-utxo `Utxo`, JSON form). */
export type UtxoView = {
  txid: string;
  vout: number;
  /** Base units, decimal string. */
  value: string;
  address: string;
  derivationPath: string;
  /** null while unconfirmed. */
  height: number | null;
  replaceable: boolean;
  change: boolean;
};

/** An address of an account and where it derives from. */
export type AddressView = { address: string; derivation_path: string };

/** Extension (not in portfolio-service): an address of an account, `used` once it holds history. */
export type AccountAddressView = AddressView & { used: boolean };

/** Extension (not in portfolio-service): what the network knows of a transaction. */
export type TransactionInfoView = {
  hash: string;
  /** null while known but not in a block. */
  block: { height: number; hash: string; time: string } | null;
  /** Decimal string. */
  fee?: string;
  /** Decimal string. */
  value?: string;
  /** Decimal string. */
  sequence?: string;
  /** Input data (EVM calldata), hex. */
  data?: string;
};

/**
 * The service's transaction intent: amounts as decimal strings, `networkParams` per network.
 *
 * `networkParams` carries what the common fields do not: `data`, `memo`, `useAllAmount`,
 * `sequence`, `mode`, `valAddress`, `dstValAddress`, `valId`, `withdrawId`, `accountOptions`,
 * `feeParameters` (the fee options). The local implementations take them in memory (a bigint
 * sequence, Map memos, Buffer/Uint8Array data) and spread them into the coin intent; the service
 * takes their wire form.
 */
export type TransactionIntentView = {
  type: string;
  sender: string;
  senderPublicKey?: string;
  recipient?: string;
  amount?: string;
  asset?: string;
  feesStrategy?: FeesStrategy;
  networkParams?: unknown;
  /**
   * Extension (not in portfolio-service): the asset as its chain names it; the local
   * implementations require it for any asset but "native".
   */
  assetInfo?: AssetInfoView;
  /** Extension (not in portfolio-service): absent means "transaction". */
  intentType?: "transaction" | "staking";
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

/** Extension (not in portfolio-service): how a transaction is broadcast (coin-module-framework `BroadcastConfig`). */
export type BroadcastConfigView = {
  mevProtected: boolean;
  sponsored?: boolean;
  /** Where the transaction comes from. */
  source?: { type: "dApp" | "live-app" | "coin-module" | "swap"; name: string };
};

export type BroadcastTransactionRequest = {
  signedTransaction: string;
  /** Extension (not in portfolio-service): MEV protection, sponsorship, origin. */
  broadcastConfig?: BroadcastConfigView;
};
export type BroadcastTransactionResponse = { transactionId: string };

/**
 * Extension (not in portfolio-service). The fee options travel in
 * `intent.networkParams.feeParameters`, as for estimate and encode.
 */
export type ValidateTransactionRequest = { intent: TransactionIntentView; customFees?: string };

/** Extension (not in portfolio-service): what a transaction would do, and what prevents it. */
export type TransactionValidationView = {
  errors: Record<string, ErrorView>;
  warnings: Record<string, ErrorView>;
  /** Decimal strings, as every amount below. */
  estimatedFees: string;
  totalFees?: string;
  amount: string;
  totalSpent: string;
};

/** Extension (not in portfolio-service): a transaction built elsewhere (wallet-api, dApp), wrapped for signing. */
export type EncodeRawTransactionRequest = {
  transaction: string;
  sender: string;
  senderPublicKey: string;
  /** Decimal; absent: the network's next sequence of `sender`. */
  sequence?: string;
};

/** Extension (not in portfolio-service): the network's read-only contract call (`CoinModuleApi.call`, EVM `eth_call`). */
export type CallRequest = { params: JsonValue };

/** Extension (not in portfolio-service). */
export type CallResponse = { result: JsonValue };

/** Extension (not in portfolio-service): what the coin module validates an address against. */
export type ValidateAddressParameters = { networkId?: number };

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
  /** `parameters` is an extension (not in portfolio-service). */
  validateAddress: (
    network: Network,
    address: string,
    parameters?: ValidateAddressParameters,
  ) => Promise<{ valid: boolean }>;
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

  // Extensions (not in portfolio-service): optional; an implementation that cannot serve one
  // omits it (`requireExtension` and `isUnsupported` tell a client so).

  /** Account read: where the account receives (`AccountModuleApi.getFreshAddress`). */
  getFreshAddress?: (portfolioId: string, accountId: string) => Promise<AddressView>;
  /** Account read: the next change address of a UTXO account (`getChangeAddress`). */
  getChangeAddress?: (portfolioId: string, accountId: string) => Promise<AddressView>;
  /** Account read: every address of the account (`AccountModuleApi.getAddresses`). */
  getAccountAddresses?: (
    portfolioId: string,
    accountId: string,
  ) => Promise<{ items: AccountAddressView[] }>;
  /** Account read: the unspent outputs of a UTXO account (`AccountModuleApi.getUTXOs`). */
  getAccountUtxos?: (portfolioId: string, accountId: string) => Promise<{ items: UtxoView[] }>;
  /** Network read: `/v1/{network}/account/{address}/info`, should the service add it. */
  getAccountInfo?: (network: Network, address: string) => Promise<AccountInfoView>;
  /** Network read: a read-only contract call. */
  call?: (network: Network, request: CallRequest) => Promise<CallResponse>;
  /** Network read (ADR-055): the addresses a public key controls, on networks that hand addresses out. */
  getAddressesForPublicKey?: (
    network: Network,
    publicKey: string,
  ) => Promise<{ addresses: string[] }>;
  /** Network read: undefined when the network does not know the hash. */
  getTransactionInfo?: (network: Network, hash: string) => Promise<TransactionInfoView | undefined>;
  /** Write: what a transaction would do, and what prevents it. */
  validateTransaction?: (
    network: Network,
    request: ValidateTransactionRequest,
  ) => Promise<TransactionValidationView>;
  /** Write: a transaction built elsewhere, wrapped for signing (`CoinModuleApi.craftRawTransaction`). */
  encodeRawTransaction?: (
    network: Network,
    request: EncodeRawTransactionRequest,
  ) => Promise<EncodeTransactionResponse>;
};

/** The error types of the service. */
export type PortfolioErrorType =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "METHOD_NOT_ALLOWED"
  | "TOO_MANY_REQUESTS"
  | "INTERNAL_ERROR"
  | "UNAVAILABLE";
