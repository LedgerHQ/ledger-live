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

export type TokenAssociateProperties = {
  name: "tokenAssociate";
  token: TokenCurrency;
};

export type Transaction = TransactionCommon & {
  family: "hedera";
  memo?: string | undefined;
  properties?: TokenAssociateProperties;
};

export type TransactionRaw = TransactionCommonRaw & {
  family: "hedera";
  memo?: string | undefined;
  properties?: TokenAssociateProperties;
};

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
};

export type HederaOperationType = "CryptoTransfer" | "TokenTransfer" | "TokenAssociate";

export type HederaOperation = Operation<HederaOperationExtra>;
