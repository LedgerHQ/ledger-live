import type { Transaction } from "../types";
import { sync, scanAccounts, SignerFactory } from "../js-synchronisation";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { calculateFees } from "./../cache";
import { perCoinLogic } from "../logic";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { withDevicePromise } from "../../../hw/deviceAccess";
import Btc from "@ledgerhq/hw-app-btc";
import { of } from "rxjs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

const receive = makeAccountBridgeReceive({
  injectGetAddressParams: account => {
    const perCoin = perCoinLogic[account.currency.id];

    if (perCoin && perCoin.injectGetAddressParams) {
      return perCoin.injectGetAddressParams(account);
    }
  },
});

const updateTransaction = (t, patch): any => {
  const updatedT = { ...t, ...patch };

  // We accept case-insensitive addresses as input from user,
  // but segwit addresses need to be converted to lowercase to be valid
  if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
    updatedT.recipient = updatedT.recipient.toLowerCase();
  }

  return updatedT;
};

const signerFactory: SignerFactory = (
  deviceId: string,
  crypto: CryptoCurrency
): Promise<Btc> => {
  return withDevicePromise(deviceId, (transport) =>
    of(new Btc({ transport, currency: crypto.id }))
  );
};

const currencyBridge: CurrencyBridge = {
  scanAccounts: scanAccounts(signerFactory),
  preload: () => Promise.resolve({}),
  hydrate: () => {},
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  prepareTransaction,
  updateTransaction,
  getTransactionStatus,
  receive,
  sync: sync(signerFactory),
  signOperation,
  broadcast: async ({ account, signedOperation }) => {
    calculateFees.reset();
    return broadcast({
      account,
      signedOperation,
    });
  },
  assignFromAccountRaw,
  assignToAccountRaw,
};

export default {
  currencyBridge,
  accountBridge,
};
