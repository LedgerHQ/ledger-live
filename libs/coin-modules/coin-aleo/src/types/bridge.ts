import BigNumber from "bignumber.js";
import type {
  Account,
  AccountRaw,
  Operation,
  OperationExtra,
  OperationExtraRaw,
  OperationRaw,
  TokenAccount,
  TokenAccountRaw,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { TRANSACTION_TYPE } from "../constants";
import type { AleoTransactionType } from "./api";
import type { ProvableApi, AleoUnspentRecord } from "./logic";

export type Transaction = TransactionCommon & {
  family: "aleo";
  fees: BigNumber;
} & (
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.BOND_PUBLIC;
        withdrawal: string;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.UNBOND_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
        properties?: never;
      }
  );

export type TransactionRaw = TransactionCommonRaw & {
  family: "aleo";
  fees: string;
} & (
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC;
        properties: {
          amountRecordCommitments: string[];
          feeRecordCommitment: string | null;
        };
      }
    | {
        mode: typeof TRANSACTION_TYPE.BOND_PUBLIC;
        withdrawal: string;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.UNBOND_PUBLIC;
        properties?: never;
      }
    | {
        mode: typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
        properties?: never;
      }
  );

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface AleoResources {
  transparentBalance: BigNumber;
  provableApi: ProvableApi | null;
  privateBalance: BigNumber | null;
  unspentPrivateRecords: AleoUnspentRecord[] | null;
  lastPrivateSyncDate: Date | null;
  hasMigratedPublicTokens?: boolean;
  hasMigratedPrivateTokens?: boolean;
  hasBackfilledStakingSenders?: boolean;
  bondedBalance?: BigNumber;
  bondedValidator?: string | null;
  unbondingBalance?: BigNumber;
  unbondingHeight?: number | null;
}

export interface AleoResourcesRaw {
  transparentBalance: string;
  provableApi: string | null;
  privateBalance: string | null;
  unspentPrivateRecords: string | null;
  lastPrivateSyncDate: string | null;
  hasMigratedPublicTokens?: boolean;
  hasMigratedPrivateTokens?: boolean;
  hasBackfilledStakingSenders?: boolean;
  bondedBalance?: string;
  bondedValidator?: string | null;
  unbondingBalance?: string;
  unbondingHeight?: number | null;
}

export type AleoAccount = Account & {
  aleoResources?: AleoResources;
  /**
   * Transient, non-persisted list of pending operation ids that the public sync
   * determined should be evicted (reverted txs listed under a fee-derived id, so
   * they cannot be dropped by id match alone). It is threaded from
   * performPublicSync through the returned account shape to postSync, which
   * consumes and strips it. Deliberately absent from AleoAccountRaw so it is
   * never serialized.
   */
  pendingEvictionIds?: string[];
};

export type AleoAccountRaw = AccountRaw & {
  aleoResources?: AleoResourcesRaw;
};

export type AleoTokenAccount = TokenAccount & {
  transparentBalance: BigNumber;
  privateBalance: BigNumber | null;
  unspentPrivateRecords: AleoUnspentRecord[] | null;
};

export type AleoTokenAccountRaw = TokenAccountRaw & {
  transparentBalance: string;
  privateBalance: string | null;
  unspentPrivateRecords: string | null;
};

export type AleoOperationExtra = {
  functionId: string;
  // this field is used to determine the type of balance that is related to the operation
  transactionType: AleoTransactionType;
  // this field is used to indicate that semi-public operation has been patched with private data after private sync
  patched?: boolean;
  // token program id for token operations (CAL lookup, sub-account routing)
  programId?: string;
  // on-chain transition id of the tx; stable join key used to correlate a pending op
  // (keyed by execution/broadcast id) with its confirmed listing row (keyed by transaction id)
  transitionId?: string;
};

export type AleoOperationExtraRaw = {
  functionId: string;
  transactionType: AleoTransactionType;
  patched?: boolean;
  programId?: string;
  transitionId?: string;
};

export function isAleoOperationExtra(extra: OperationExtra): extra is AleoOperationExtra {
  return extra !== null && typeof extra === "object" && "functionId" in extra;
}

export function isAleoOperationExtraRaw(extraRaw: OperationExtraRaw): extraRaw is AleoOperationExtraRaw {
  return extraRaw !== null && typeof extraRaw === "object" && "functionId" in extraRaw;
}

export type OperationDetailsExtraField = {
  key: keyof AleoOperationExtra;
  value: string | number;
};

export type AleoOperation = Operation<AleoOperationExtra>;
export type AleoOperationRaw = OperationRaw<AleoOperationExtraRaw>;

export type TransactionTransfer = Extract<
  Transaction,
  {
    mode:
      | typeof TRANSACTION_TYPE.TRANSFER_PUBLIC
      | typeof TRANSACTION_TYPE.TRANSFER_PRIVATE
      | typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC
      | typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE
      | typeof TRANSACTION_TYPE.BOND_PUBLIC;
  }
>;

export type TransactionSelfTransfer = Extract<
  Transaction,
  {
    mode:
      | typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
      | typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
      | typeof TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC
      | typeof TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
      | typeof TRANSACTION_TYPE.UNBOND_PUBLIC
      | typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
  }
>;

export type TransactionPublic = Extract<
  Transaction,
  {
    mode:
      | typeof TRANSACTION_TYPE.CONVERT_PUBLIC_TO_PRIVATE
      | typeof TRANSACTION_TYPE.TRANSFER_PUBLIC
      | typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC
      | typeof TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE
      | typeof TRANSACTION_TYPE.BOND_PUBLIC
      | typeof TRANSACTION_TYPE.UNBOND_PUBLIC
      | typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
  }
>;

export type TransactionPrivate = Extract<
  Transaction,
  {
    mode:
      | typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC
      | typeof TRANSACTION_TYPE.TRANSFER_PRIVATE
      | typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE
      | typeof TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC;
  }
>;
