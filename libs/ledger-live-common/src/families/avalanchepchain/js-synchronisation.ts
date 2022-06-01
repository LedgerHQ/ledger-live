import { encodeAccountId } from "../../account";
import {
    makeSync,
    makeScanAccounts,
    GetAccountShape,
    mergeOps,
} from "../../bridge/jsHelpers";
import { getAccount, getOperations } from "./api";
import HDKey from 'hdkey';

const getAccountShape: GetAccountShape = async (info) => {
    const { address, initialAccount, currency, derivationMode } = info;

    const publicKey = info.rest?.publicKey || info.initialAccount?.avalanchePChainResources?.publicKey;
    const chainCode = info.rest?.chainCode || info.initialAccount?.avalanchePChainResources?.chainCode;

    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    const chainCodeBuffer = Buffer.from(chainCode, 'hex');

    const hdKey = new HDKey();
    hdKey.publicKey = publicKeyBuffer;
    hdKey.chainCode = chainCodeBuffer;

    const oldOperations = initialAccount?.operations || [];

    const startAt = oldOperations.length
        ? (oldOperations[0].blockHeight || 0) + 1
        : 0;

    const accountId = encodeAccountId({
        type: "js",
        version: "2",
        currencyId: currency.id,
        xpubOrAddress: address,
        derivationMode,
    });

    const { balance } = await getAccount(hdKey);
    let operations = oldOperations;

    const newOperations = await getOperations(
        hdKey,
        startAt,
        accountId,
    );

    operations = mergeOps(operations, newOperations);

    const shape = {
        id: accountId,
        balance,
        spendableBalance: balance,
        operationsCount: operations.length,
        avalanchePChainResources: {
            publicKey: publicKeyBuffer.toString('hex'),
            chainCode: chainCodeBuffer.toString('hex')
        }
    };

    return {
        ...shape,
        operations
    }
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape }); 