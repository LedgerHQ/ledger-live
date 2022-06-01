import type { BigNumber } from "bignumber.js";
import type {
    TransactionCommon,
    TransactionCommonRaw,
} from "../../types/transaction";
import { Buffer } from "buffer/";

export type NetworkInfo = {
    family: "avalanchepchain";
};
export type NetworkInfoRaw = {
    family: "avalanchepchain";
};
export type Transaction = TransactionCommon & {
    family: "avalanchepchain";
};
export type TransactionRaw = TransactionCommonRaw & {
    family: "avalanchepchain";
};

export interface AddressBatch {
    nonChange: {
        addresses: string[],
        pkhs: Buffer[]
    },
    change: {
        addresses: string[],
        pkhs: Buffer[]
    },
    utxoset: any
}

export type AvalanchePChainResources = {
    publicKey: string;
    chainCode: string;
}

export type AvalanchePChainResourcesRaw = {
    publicKey: string;
    chainCode: string;
}