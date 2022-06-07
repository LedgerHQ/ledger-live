import type { AccountBridge, CurrencyBridge } from "../../../types";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { sync, scanAccounts } from "../js-synchronisation";
import { createTransaction, prepareTransaction, updateTransaction } from '../js-transaction';
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from '../js-signOperation';
import broadcast from "../js-broadcast";
import estimateMaxSpendable from '../js-estimateMaxSpendable';

const preload = () => Promise.resolve({});
const hydrate = (): void => { };

const receive = makeAccountBridgeReceive();

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
