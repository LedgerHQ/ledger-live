import { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountRaw,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type NetworkInfo = {
  family: "hedera";
};

export type NetworkInfoRaw = {
  family: "hedera";
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string | undefined;
} & (
    | {
        mode: "send";
        properties?: never;
      }
    | {
        mode: "token-associate";
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
} & (
    | {
        mode: "send";
        properties?: never;
      }
    | {
        mode: "token-associate";
        assetReference: string;
        assetOwner: string;
        properties: {
          token: TokenCurrency;
        };
      }
  );

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
  memo?: string | null;
};

export type HederaOperation = Operation<HederaOperationExtra>;
