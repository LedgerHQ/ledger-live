import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { Operation, OperationType } from "../../../types";
import { encodeOperationId } from "../../../operation";

const getIndexerUrl = (route: string): string =>
    `${getEnv("API_AVALANCHE_INDEXER")}${route || ""}`;

const getNodeUrl = (): string =>
    `${getEnv("API_AVALANCHE_NODE")}`;

/**
 * Fetch operation list from indexer
 */
const fetchOperations = async (
    address: string,
    startHeight: number
) => {
    const { data } = await network({
        method: "GET",
        url: getIndexerUrl(`/transactions?address=${address}&start_height=${startHeight}&limit=100`),
    });

    return data;
};

const fetchAccountDetails = async (
    address: string
) => {
    const { data } = await network({
        method: "GET",
        url: getIndexerUrl(`/address/${address}`)
    })

    return data;
}

const convertTransactionToOperation = (transaction, accountId): Operation => {
    const convertUnits = (value) => new BigNumber(value).multipliedBy(1000000000);

    const type = getOperationType(transaction.type);
    const value = convertUnits(new BigNumber(transaction.outputs?.[0].amount));
    const fee = convertUnits(new BigNumber(transaction.fee));

    return {
        id: encodeOperationId(accountId, transaction.id, type),
        hash: transaction.id,
        type,
        value,
        fee,
        senders: transaction.inputs?.[0].addresses ?? [],
        recipients: transaction.outputs?.[0].addresses ?? [],
        blockHeight: transaction.block_height,
        blockHash: transaction.block,
        accountId,
        date: new Date(transaction.timestamp),
        extra: {}
    }
}

const getOperationType = (type: string): OperationType => {
    switch (type) {
        case "c_atomic_export":
            return "OUT";
        case "c_atomic_import":
            return "IN";
        default:
            return "NONE";
    }
};

export const getOperations = async (accountId: string, address: string, blockStartHeight: number): Promise<Operation[]> => {
    const operations = await fetchOperations(address, blockStartHeight);
    return operations.map(o => convertTransactionToOperation(o, accountId));
}

export const getAccount = async (address: string) => {
    const { balance, height: blockHeight } = await fetchAccountDetails(address);

    return {
        balance: new BigNumber(balance),
        blockHeight
    }
}