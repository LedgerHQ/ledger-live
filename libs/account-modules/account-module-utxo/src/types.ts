import type {
  AccountModuleApi,
  AccountData,
  AccountTypes,
} from "@ledgerhq/account-module-framework";
import type {
  Balance,
  CoinModuleApi,
  CraftedTransaction,
  FeeEstimation,
  ListOperationsOptions,
  Page,
  TransactionIntent,
  TransactionValidation,
  TxData,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";

export type UtxoTransactionInput = {
  /** Previous transaction; absent for a coinbase input. */
  txid?: string;
  vout: number;
  address?: string;
  /** Base units, decimal string. */
  value: string;
  /** On chains whose inputs carry one. */
  sequence?: number;
};

export type UtxoTransactionOutput = {
  index: number;
  address?: string;
  /** Base units, decimal string. */
  value: string;
};

/** A whole transaction, every input and output: what an account needs to interpret it. */
export type UtxoTransaction = {
  id: string;
  /** ISO date the network first saw it. */
  receivedAt: string;
  block: { height: number; hash: string; time: string } | null;
  /** Base units, decimal string. */
  fees: string;
  /** Can still be replaced while pending (BIP125 on bitcoin). */
  replaceable: boolean;
  inputs: UtxoTransactionInput[];
  outputs: UtxoTransactionOutput[];
};

/** An output the coin selection may spend. */
export type UtxoCandidate = {
  txid: string;
  vout: number;
  /** Base units, decimal string. */
  value: string;
  address: string;
  /** `null` while pending. */
  height: number | null;
  replaceable: boolean;
};

/** What the account module adds to `intent.data`, next to the coin module's own fields. */
export type UtxoIntentData = {
  /** Derivation mode of the account. */
  derivationMode?: string;
  inputs?: Array<{
    txid: string;
    vout: number;
    address: string;
    path: string;
    value?: string;
    blockHeight?: number | null;
  }>;
  change?: { address: string; path: string };
  replacement?: { txid: string; conflictingTxIds?: string[] };
};

/** `CraftedTransaction.details` of a UTXO coin module. */
export type UtxoCraftedDetails = {
  /** Spent outpoints, "txid-vout". */
  inputs: string[];
  fee: bigint;
  /** Sent to the recipient. */
  amount: bigint;
  senders: string[];
  recipients: string[];
  /** Can be replaced while pending (BIP125 on bitcoin). */
  replaceable?: boolean;
};

/** The intent a UTXO coin module receives: the account module always gives it its data. */
export type UtxoCoinIntent = TransactionIntent<any, any> & { data: any };

/** The primitives a UTXO account needs from its coin module, stateless and per address. */
export type UtxoPrimitives = {
  /** The address of an account key on an HD chain, in the form `listAddressTransactions` takes. */
  deriveAddress: (
    context: Context<any>,
    request: { key: string; derivationMode: string; chain: number; index: number },
  ) => Promise<string>;
  /** Transactions touching an address; the first page also carries the mempool ones. */
  listAddressTransactions: (
    context: Context<any>,
    address: string,
    options: ListOperationsOptions,
  ) => Promise<Page<UtxoTransaction>>;
  /** A transaction by its id, whatever address it touches: what a replacement spends again. */
  getTransaction: (
    context: Context<any>,
    txid: string,
  ) => Promise<Pick<UtxoTransaction, "id" | "fees" | "inputs" | "outputs">>;
  /** Coin selection: which candidates fund the intent, with the chain's size and fee maths. */
  selectInputs: (
    context: Context<any>,
    request: {
      intent: UtxoCoinIntent;
      candidates: UtxoCandidate[];
      strategy?: unknown;
      customFeesParameters?: Record<string, unknown>;
    },
  ) => Promise<Array<{ txid: string; vout: number }>>;
  /** The address as the account shows it; unchanged when absent. */
  displayAddress?: (address: string) => string;
};

/** The write methods of the coin module, on intents the account module completed. */
export type UtxoWriteMethods = {
  estimateFees: (
    context: Context<any>,
    intent: UtxoCoinIntent,
    options?: Parameters<CoinModuleApi<any, any, any>["estimateFees"]>[2],
  ) => Promise<FeeEstimation>;
  validateIntent: (
    context: Context<any>,
    intent: UtxoCoinIntent,
    balances: Balance[],
    options?: { customFees?: FeeEstimation },
  ) => Promise<TransactionValidation>;
  craftTransaction: (
    context: Context<any>,
    intent: UtxoCoinIntent,
    options?: { customFees?: FeeEstimation },
  ) => Promise<CraftedTransaction>;
  /** The coin module's own data of an intent that has none yet. */
  craftTransactionData?: (context: Context<any>, intent: UtxoCoinIntent) => TxData;
};

export type UtxoCoinModuleApi = Pick<
  CoinModuleApi<any, any, any>,
  "lastBlock" | "getBlockInfo" | "combine" | "broadcast"
> &
  UtxoWriteMethods &
  UtxoPrimitives;

/** Options of the write path. */
export type UtxoAccountOptions = {
  /** Outputs the coin selection must not pick. */
  excludedUtxos?: Array<{ txid: string; vout: number }>;
  /** Coin selection strategy, as the coin module names it. */
  strategy?: unknown;
  /** A pending transaction of the account to replace (speed up, cancel). */
  replaceTxId?: string;
};

export type UtxoAddressState = { address: string; chain: number; index: number };

export type UtxoState = {
  txid: string;
  vout: number;
  /** Base units, decimal string. */
  value: string;
  address: string;
  /** `null` while pending. */
  height: number | null;
  replaceable: boolean;
};

export const UTXO_ACCOUNT_STATE_VERSION = 2;

/** Small, versioned and rebuildable from the network. Addresses as the coin module derives them. */
export type UtxoAccountState = {
  /** Chain tip at the last sync; the next one resumes `rewindBlocks` below it. */
  syncedHeight: number;
  /** Highest block holding a transaction of the account, to detect reorgs. */
  anchor: { height: number; hash: string } | null;
  /** Every address of the account holding history. */
  addresses: UtxoAddressState[];
  /** Outputs of confirmed transactions that no confirmed transaction spends. */
  confirmedUtxos: UtxoState[];
  /** Unspent outputs, mempool applied, replaced transactions removed. */
  utxos: UtxoState[];
  /**
   * Epoch-ms time of the last walk of the addresses (a sync, or a refreshing read), which every
   * read derives from; 0: never.
   */
  refreshedAt: number;
};

export type Utxo = {
  txid: string;
  vout: number;
  value: bigint;
  /** As the account shows it. */
  address: string;
  derivationPath: string;
  height: number | null;
  replaceable: boolean;
  change: boolean;
};

export interface UtxoAccountTypes extends AccountTypes {
  state: UtxoAccountState;
  options: UtxoAccountOptions;
  utxo: Utxo;
}

export type UtxoAccountModuleApi = AccountModuleApi<UtxoAccountTypes> & {
  getUTXOs: NonNullable<AccountModuleApi<UtxoAccountTypes>["getUTXOs"]>;
  /** Where the change of the next transaction goes. */
  getChangeAddress: (
    context: Context<any>,
    account: AccountData<UtxoAccountState>,
  ) => Promise<{ address: string; derivationPath: string }>;
};

export type UtxoAccountModuleOptions = {
  receiveChain?: number;
  changeChain?: number;
  /** Unused addresses walked past the last used one, per chain. */
  gapLimit?: number;
  /** Blocks read again below the last synced tip, so a replaced block is not missed. */
  rewindBlocks?: number;
  /** Age after which an unconfirmed operation is dropped. */
  replacedOperationExpiryMs?: (context: Context<any>) => Promise<number | undefined>;
  now?: () => number;
};
