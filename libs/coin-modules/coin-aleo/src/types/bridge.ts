import BigNumber from "bignumber.js";
import type {
  Account,
  AccountRaw,
  Operation,
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
  hasMigratedStaking?: boolean;
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
  hasMigratedStaking?: boolean;
  bondedBalance?: string;
  bondedValidator?: string | null;
  unbondingBalance?: string;
  unbondingHeight?: number | null;
}

/**
 * The staking slice of {@link AleoResources}. Absent entirely — not zeroed — while the
 * `enableStaking` flag is off, since the mappings are then never read.
 */
export type AleoStakingResources = Pick<
  AleoResources,
  "bondedBalance" | "bondedValidator" | "unbondingBalance" | "unbondingHeight"
>;

export type AleoAccount = Account & {
  aleoResources?: AleoResources;
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
  // source program of the operation (CAL lookup, sub-account routing, staking detection).
  // Absent on operations persisted before it was recorded.
  programId?: string;
  // BOND only: unbond_public/claim_unbond_public name no validator on-chain
  validator?: string;
  // BOND/UNBOND only: the bonded/unbonded principal. Staking only moves funds between the
  // account's own balances, so a staking op's `value` is the fee and the principal is carried here.
  stakedAmount?: BigNumber;
};

export type AleoOperationExtraRaw = {
  functionId: string;
  transactionType: AleoTransactionType;
  patched?: boolean;
  programId?: string;
  validator?: string;
  stakedAmount?: string;
};

export type OperationDetailsExtraField = {
  key: keyof AleoOperationExtra;
  value: string | number;
};

export type AleoOperation = Operation<AleoOperationExtra>;

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
