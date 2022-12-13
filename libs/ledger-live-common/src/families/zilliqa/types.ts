import type { BigNumber } from "bignumber.js";
import Long from "long";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import type {
	TransactionCommon,
	TransactionCommonRaw,
	TransactionStatusCommon,
	TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";

export type Transaction = TransactionCommon & {
	family: "zilliqa";
	//	fee: BigNumber | null | undefined;
	//	gasprice: BigNumber | undefined | null;
	//	gaslimit: Long | undefined | null;
};

export type TransactionRaw = TransactionCommonRaw & {
	family: "zilliqa";
	//	fee: BigNumber | null | undefined;
	//	gasprice: BigNumber | undefined | null;
	//	gaslimit: Long | undefined | null;
};
export type TransactionStatus = TransactionStatusCommon;
export type TransactionStatusRaw = TransactionStatusCommonRaw;
