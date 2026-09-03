import BigNumber from "bignumber.js";
import type {
  MemoNotSupported,
  TransactionIntent,
  TxDataNotSupported,
} from "@ledgerhq/coin-module-framework/api/types";
import type { TRANSACTION_TYPE } from "../constants";
import type {
  AleoRecordScannerStatusResponse,
  AleoPublicTransactionDetailsResponse,
  AleoPrivateRecord,
  AleoExactTransitionCursor,
} from "./api";
import type { AleoDecryptedRecordResponse } from "./sdk";

export type AleoRegistration = { type: "aleo"; provableId: string };

export interface AleoUnspentRecord extends AleoPrivateRecord {
  microcredits: string;
  decryptedData: AleoDecryptedRecordResponse;
}

export interface AleoPrivateTokenBalance {
  id: string;
  contractAddress: string;
  balance: BigNumber;
  unspentRecords: AleoUnspentRecord[];
}

export type EnrichedPrivateRecord = {
  rawRecord: AleoPrivateRecord;
  details: AleoPublicTransactionDetailsResponse;
  sender: string;
  recipient: string;
  value: BigNumber;
};

export interface ProvableApi {
  uuid?: string;
  // Bridge persists only the sync flags; the height fields are read live via getAccountInfo.
  scannerStatus?: Pick<AleoRecordScannerStatusResponse, "synced" | "percentage">;
}

export type AleoAccountInfo = {
  type: "aleo";
  synced: boolean;
  percentage: number;
  startHeight: number;
  scannedHeight: number;
};

export type AleoValidatorNonEarningReason = "overConcentrated" | "fullCommission";

export type AleoValidator = {
  address: string;
  name?: string;
  stakeMicrocredits: number;
  isOpen: boolean;
  commissionPercent: number;
  /**
   * Estimated net yearly rate as a fraction (0.07 = 7%). Absent when it could not be
   * derived; `0` is a real value meaning "earns nothing".
   */
  estimatedYearlyRewardsRate?: number;
  nonEarningReason?: AleoValidatorNonEarningReason;
};

export type AleoStakingPosition = {
  bondedBalance: BigNumber;
  bondedValidator: string | null;
  unbondingBalance: BigNumber;
  unbondingHeight: number | null;
  withdrawalAddress: string | null;
};

/** `<maxBlockHeight>:<blockNumber>:<transitionId>` — the pinned ceiling, then the row to resume after. */
export type OperationsCursor = {
  maxBlockHeight: number;
  resumeFrom: AleoExactTransitionCursor;
};

export type RecordPickingStrategy = "manual" | "auto";

export type AleoTokenType = "arc20" | "arc21" | "arc22" | "unknown";

export type TransactionType = (typeof TRANSACTION_TYPE)[keyof typeof TRANSACTION_TYPE];

export type AleoTransactionIntentData =
  | TxDataNotSupported
  | {
      type: typeof TRANSACTION_TYPE.TRANSFER_PRIVATE;
      records: AleoDecryptedRecordResponse[];
      tvks: string[];
    }
  | {
      type: typeof TRANSACTION_TYPE.CONVERT_PRIVATE_TO_PUBLIC;
      records: AleoDecryptedRecordResponse[];
      tvks: string[];
    }
  | {
      type: typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PRIVATE;
      programId: string;
      records: AleoDecryptedRecordResponse[];
      tvks: string[];
    }
  | {
      type: typeof TRANSACTION_TYPE.CONVERT_TOKEN_PRIVATE_TO_PUBLIC;
      programId: string;
      records: AleoDecryptedRecordResponse[];
      tvks: string[];
    }
  | {
      type: "fee_public";
      priorityFee?: bigint;
      executionId: string;
    }
  | {
      type: "fee_private";
      priorityFee?: bigint;
      executionId: string;
      record: AleoDecryptedRecordResponse;
    }
  | {
      type: typeof TRANSACTION_TYPE.TRANSFER_TOKEN_PUBLIC;
      programId: string;
    }
  | {
      type: typeof TRANSACTION_TYPE.CONVERT_TOKEN_PUBLIC_TO_PRIVATE;
      programId: string;
    }
  | {
      type: typeof TRANSACTION_TYPE.BOND_PUBLIC;
      withdrawal: string;
    }
  | {
      type: typeof TRANSACTION_TYPE.UNBOND_PUBLIC;
    }
  | {
      type: typeof TRANSACTION_TYPE.CLAIM_UNBOND_PUBLIC;
    };

export type AleoTransactionIntent = TransactionIntent<MemoNotSupported, AleoTransactionIntentData>;

export interface SignedAleoTransaction {
  authorization: string;
  feeAuthorization: string | null;
}

export type SigningStrategy = "fast" | "balanced" | "full";

export interface StrategyConfig {
  min: number;
  max: number;
}
