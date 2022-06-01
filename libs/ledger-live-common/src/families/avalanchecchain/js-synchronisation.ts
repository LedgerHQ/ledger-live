import { encodeAccountId } from "../../account";
import {
    makeSync,
    makeScanAccounts,
    GetAccountShape,
    mergeOps,
} from "../../bridge/jsHelpers";
import { getAccount, getOperations } from "./api";

const getAccountShape: GetAccountShape = async (info) => {
    const { address, initialAccount, currency, derivationMode } = info;
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

    const { balance, blockHeight } = await getAccount(address);
    let operations = oldOperations;

    const newOperations = await getOperations(
        accountId,
        address,
        startAt
    );

    operations = mergeOps(operations, newOperations);

    const shape = {
        id: accountId,
        balance,
        spendableBalance: balance,
        operationsCount: operations.length,
        blockHeight
    };

    return { ...shape, operations };
};

export const scanAccounts = makeScanAccounts({ getAccountShape });
export const sync = makeSync({ getAccountShape });