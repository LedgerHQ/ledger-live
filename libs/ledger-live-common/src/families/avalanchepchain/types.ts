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
    fees: BigNumber | null;
    mode: string;
};

export type TransactionRaw = TransactionCommonRaw & {
    family: "avalanchepchain";
    fees: string | null;
    mode: string;
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
    stakedBalance: BigNumber;
}

export type AvalanchePChainResourcesRaw = {
    publicKey: string;
    chainCode: string;
    stakedBalance: string;
}