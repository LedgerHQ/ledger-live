import type { AccountBridge, CurrencyBridge } from "../../../types";
import type { Transaction } from '../types';
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { sync, scanAccounts } from "../js-synchronisation";

const preload = () => Promise.resolve({});
const hydrate = (): void => { };

const receive = makeAccountBridgeReceive();


const createTransaction = () => {
    throw new Error("createTransaction not implemented");
};

const prepareTransaction = () => {
    throw new Error("prepareTransaction not implemented");
};

const updateTransaction = () => {
    throw new Error("updateTransaction not implemented");
};

const getTransactionStatus = () => {
    throw new Error("getTransactionStatus not implemented");
};

const estimateMaxSpendable = () => {
    throw new Error("estimateMaxSpendable not implemented");
};

const signOperation = () => {
    throw new Error("signOperation not implemented");
};

const broadcast = () => {
    throw new Error("broadcast not implemented");
};

const currencyBridge: CurrencyBridge = {
    preload,
    hydrate,
    scanAccounts,
};
const accountBridge: AccountBridge<Transaction> = {
    estimateMaxSpendable,
    createTransaction,
    updateTransaction,
    getTransactionStatus,
    prepareTransaction,
    sync,
    receive,
    signOperation,
    broadcast,
};
export default {
    currencyBridge,
    accountBridge,
};