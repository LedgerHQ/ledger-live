import type { BigNumber } from "bignumber.js";
import Long from "long";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
	Account,
	AccountRaw,
	TransactionCommon,
	TransactionCommonRaw,
	TransactionStatusCommon,
	TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type ZilliqaResources = {
	publicKey: string;
	nonce: number;
};

export type ZilliqaResourcesRaw = {
	publicKey: string;
	nonce: Long;
};

export type Transaction = TransactionCommon & {
	family: "zilliqa";
	fee?: BigNumber;
	gasPrice?: BigNumber;
	gaslimit?: Long;
};

export type TransactionRaw = TransactionCommonRaw & {
	family: "zilliqa";
	fee?: BigNumber;
	gasPrice?: BigNumber;
	gaslimit?: Long;
};
export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;

export type ZilliqaAccount = Account & {
	zilliqaResources?: ZilliqaResources;
};
export type ZilliqaAccountRaw = AccountRaw & {
	zilliqaResources?: ZilliqaResourcesRaw;
};
