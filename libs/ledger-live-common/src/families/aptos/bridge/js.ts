import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";

import { sync, scanAccounts, SignerContext } from "../js-synchronisation";
import getTransactionStatus from "../js-getTransactionStatus";
import prepareTransaction from "../js-prepareTransaction";
import createTransaction from "../js-createTransaction";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { withDevice } from "../../../hw/deviceAccess";
import Aptos from "../hw-app-aptos"; // TODO: change path when package is published
import { from, firstValueFrom } from "rxjs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { AddressData } from "../hw-app-aptos";

const receive = makeAccountBridgeReceive();

const signerContext: SignerContext = (
  deviceId: string,
  crypto: CryptoCurrency,
  fn: (signer: Aptos) => Promise<AddressData>,
): Promise<AddressData> =>
  firstValueFrom(withDevice(deviceId)(transport => from(fn(new Aptos(transport)))));

const currencyBridge: CurrencyBridge = {
  preload: () => Promise.resolve({}),
  hydrate: () => {},
  scanAccounts: scanAccounts(signerContext),
};

const updateTransaction = (t: Transaction, patch: Partial<Transaction>): Transaction => ({
  ...t,
  ...patch,
});

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync: sync(signerContext),
  receive,
  signOperation,
  broadcast,
};

export default { currencyBridge, accountBridge };
