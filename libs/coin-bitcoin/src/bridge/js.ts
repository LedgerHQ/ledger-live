import type { Transaction } from "../types";
import { sync, scanAccounts, SignerContext } from "../js-synchronisation";
import createTransaction from "../js-createTransaction";
import prepareTransaction from "../js-prepareTransaction";
import getTransactionStatus from "../js-getTransactionStatus";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { calculateFees } from "./../cache";
import { perCoinLogic } from "../logic";
import {
  defaultUpdateTransaction,
  makeAccountBridgeReceive as commonMakeAccountBridgeReceive,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { Account, AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignFromAccountRaw, assignToAccountRaw } from "../serialization";
import { withDevice } from "../../../hw/deviceAccess";
import Btc from "@ledgerhq/hw-app-btc";
import { Observable, firstValueFrom, from } from "rxjs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";

export function makeAccountBridgeReceive({
  injectGetAddressParams,
}: {
  injectGetAddressParams?: (account: Account) => any;
} = {}): (
  account: Account,
  option: {
    verify?: boolean;
    deviceId: string;
    subAccountId?: string;
    freshAddressIndex?: number;
  },
) => Observable<{
  address: string;
  path: string;
}> {
  return commonMakeAccountBridgeReceive(getAddr, {
    injectGetAddressParams,
  });
}

const receive = makeAccountBridgeReceive({
  injectGetAddressParams: account => {
    const perCoin = perCoinLogic[account.currency.id];

    if (perCoin && perCoin.injectGetAddressParams) {
      return perCoin.injectGetAddressParams(account);
    }
  },
});

const updateTransaction = (tx: Transaction, patch: Partial<Transaction>): any => {
  const updatedT = defaultUpdateTransaction(tx, patch);

  // We accept case-insensitive addresses as input from user,
  // but segwit addresses need to be converted to lowercase to be valid
  if (updatedT.recipient.toLowerCase().indexOf("bc1") === 0) {
    updatedT.recipient = updatedT.recipient.toLowerCase();
  }

  return updatedT;
};

const signerContext: SignerContext = (
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: Btc) => Promise<string>,
): Promise<string> =>
  firstValueFrom(
    withDevice(deviceId)(transport => from(fn(new Btc({ transport, currency: crypto.id })))),
  );

const currencyBridge: CurrencyBridge = {
  scanAccounts: scanAccounts(signerContext),
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
  sync: sync(signerContext),
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
