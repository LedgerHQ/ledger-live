import { BigNumber } from "bignumber.js";
import type {
    TransactionCommon,
    TransactionCommonRaw,
} from "../../types/transaction";

export type Transaction = TransactionCommon & {
    family: "avalanchecchain";
    fees: BigNumber | null;
    mode: string;
};
export type TransactionRaw = TransactionCommonRaw & {
    family: "avalanchecchain";
    fees: string | null;
    mode: string;
};
