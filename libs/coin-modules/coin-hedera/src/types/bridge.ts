import BigNumber from "bignumber.js";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import { HEDERA_TRANSACTION_MODES } from "../constants";

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string | undefined;
  maxFee?: BigNumber;
} & (
    | {
        mode: HEDERA_TRANSACTION_MODES.Send;
        gasLimit?: BigNumber;
        properties?: never;
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate;
        assetReference: string;
        assetOwner: string;
        properties: {
          token: TokenCurrency;
        };
      }
  );

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string | undefined;
  maxFee?: string;
} & (
    | {
        mode: HEDERA_TRANSACTION_MODES.Send;
        gasLimit?: string;
        properties?: never;
      }
    | {
        mode: HEDERA_TRANSACTION_MODES.TokenAssociate;
        assetReference: string;
        assetOwner: string;
        properties: {
          token: TokenCurrency;
        };
      }
  );

export type TransactionTokenAssociate = Extract<
  Transaction,
  { mode: HEDERA_TRANSACTION_MODES.TokenAssociate }
>;

export type TransactionStatus = TransactionStatusCommon;

export type TransactionStatusRaw = TransactionStatusCommonRaw;

export interface HederaResources {
  maxAutomaticTokenAssociations: number;
  isAutoTokenAssociationEnabled: boolean;
}

export interface HederaResourcesRaw {
  maxAutomaticTokenAssociations: number;
  isAutoTokenAssociationEnabled: boolean;
}

export type HederaAccount = Account & {
  hederaResources?: HederaResources;
};

export type HederaAccountRaw = AccountRaw & {
  hederaResources?: HederaResourcesRaw;
};

export type HederaOperationExtra = {
  consensusTimestamp?: string;
  transactionId?: string;
  associatedTokenId?: string;
  pagingToken?: string;
  gasConsumed?: number;
  gasLimit?: number;
  gasUsed?: number;
  memo?: string | null;
};

export type HederaOperation = Operation<HederaOperationExtra>;
