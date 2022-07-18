import BigNumber from "bignumber.js";
import { getEnv } from "../../../env";
import network from "../../../network";
import { Operation, OperationType } from "../../../types";
import { encodeOperationId } from "../../../operation";
import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm';
import BinTools from 'avalanche/dist/utils/bintools';
import { avalancheClient } from "./client";
import type { AddressBatch } from "../types";


const getIndexerUrl = (route: string): string =>
    `${getEnv("API_AVALANCHE_INDEXER")}${route || ""}`;

const getNodeUrl = (): string =>
    `${getEnv("API_AVALANCHE_NODE")}`;

export const binTools = BinTools.getInstance();
const INDEX_RANGE = 20;
const SCAN_RANGE = 80;
const P_IMPORT = "p_import";
const P_EXPORT = "p_export";

/**
 * Fetch operation list from indexer
 */
const fetchOperations = async (
    addresses: string[],
    startHeight: number
) => {
    const rawAddresses = addresses.map(removeChainPrefix).join(",");

    const { data } = await network({
        method: "GET",
        url: getIndexerUrl(`/transactions?address=${rawAddresses}&start_height=${startHeight}&limit=100`),
    });

    return data;
};

/**
 * Remove the chain prefix (e.g "P-") from the address
 * @param address - "P-avax1yvkhyf0y9674p2ps41vmp9a8w427384jcu8zmn"
 * @returns avax1yvkhyf0y9674p2ps41vmp9a8w427384jcu8zmn
 */
const removeChainPrefix = (address) => address.split('-')[1]

const convertTransactionToOperation = (transaction, accountId): Operation => {
    const type = getOperationType(transaction.type);
    const fee = new BigNumber(transaction.fee);
    const outputIndex = transaction.type === P_IMPORT ? 0 : 1;
    let value = new BigNumber(transaction.outputs?.[outputIndex].amount);

    if (transaction.type === P_EXPORT) {
        value = value.plus(fee);
    }

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
        case P_EXPORT:
            return "OUT";
        case P_IMPORT:
            return "IN";
        default:
            return "NONE";
    }
};

export const getOperations = async (hdKey: any, blockStartHeight: number, accountId: string): Promise<Operation[]> => {
    const usedKeys = await getUsedKeys(hdKey, () => { });

    const operations = await fetchOperations(usedKeys, blockStartHeight);
    const pChainOperations = operations.filter(getPChainOperations);

    return pChainOperations.map(o => convertTransactionToOperation(o, accountId));
}

const getPChainOperations = ({ type }) => type === P_IMPORT || type === P_EXPORT;

export const getAccount = async (hdKey: any) => {
    const balance = await fetchBalances(hdKey);

    return {
        balance: new BigNumber(balance),
    }
}

//Liberally inspired by avalanche-wallet-cli
export const fetchBalances = async (hdKey) => {

    let balanceTotal = new BigNumber(0);
    const assetID = await avalancheClient().PChain().getAVAXAssetID();

    const batchFunction = async (batch: AddressBatch) => {
        for (const [_, utxoids] of Object.entries<{}>(batch.utxoset.addressUTXOs)) {
            let balance = new BigNumber(0);

            for (const utxoid of Object.keys(utxoids)) {
                const utxo = batch.utxoset.utxos[utxoid];

                if (utxo.getAssetID().equals(assetID)) {
                    balance = balance.plus(utxo.getOutput().getAmount());
                }
                balanceTotal = balanceTotal.plus(balance);
            }
        }
    }

    await getUsedKeys(hdKey, batchFunction);

    return balanceTotal;
}

const getUsedKeys = async (hdKey, batchFunction) => {
    let allAddressesAreUnused = false;
    let index = 0;

    const keyPair = new AVMKeyPair("avax", "P");
    let allNonChangeAddresses: string[] = [];

    while (!allAddressesAreUnused || index < SCAN_RANGE) {
        const batch: AddressBatch = {
            nonChange: { addresses: [], pkhs: [] },
            change: { addresses: [], pkhs: [] },
            utxoset: {}
        }

        for (let i = 0; i < INDEX_RANGE; i++) {
            const child = hdKey.deriveChild(0).deriveChild(index + i);
            const changeChild = hdKey.deriveChild(1).deriveChild(index + i);

            const publicKeyHash = AVMKeyPair.addressFromPublicKey(child.publicKey);

            const changePublicKeyHash = AVMKeyPair.addressFromPublicKey(changeChild.publicKey);
            const address = binTools.addressToString("avax", "P", publicKeyHash);
            const changeAddress = binTools.addressToString("avax", "P", changePublicKeyHash);

            batch.nonChange.pkhs.push(publicKeyHash);
            batch.change.pkhs.push(changePublicKeyHash);
            batch.nonChange.addresses.push(address);
            batch.change.addresses.push(changeAddress);
        }

        const batchedAddresses = batch.nonChange.addresses.concat(batch.change.addresses);

        const pchain = avalancheClient().PChain();

        let { utxos } = await pchain.getUTXOs(batchedAddresses);
        batch.utxoset = utxos;

        batchFunction(batch);

        index += INDEX_RANGE;
        allAddressesAreUnused = batch.utxoset.getAllUTXOs().length === 0;
        allNonChangeAddresses = allNonChangeAddresses.concat(batch.nonChange.addresses);
    }

    return allNonChangeAddresses;
} 