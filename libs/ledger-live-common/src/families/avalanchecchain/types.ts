import type {
    TransactionCommon,
    TransactionCommonRaw,
} from "../../types/transaction";

export type NetworkInfo = {
    family: "avalanchecchain";
};
export type NetworkInfoRaw = {
    family: "avalanchecchain";
};
export type Transaction = TransactionCommon & {
    family: "avalanchecchain";
    memo: "",
};
export type TransactionRaw = TransactionCommonRaw & {
    family: "avalanchecchain";
    memo: ""
};
