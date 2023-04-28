import type { Transaction } from "../types";
import { SignerFactory, scanAccounts, sync } from "../js-synchronisation";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import { createTransaction, prepareTransaction, updateTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import Ada from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { withDevicePromise } from "../../../hw/deviceAccess";
import { of } from "rxjs";

const receive = makeAccountBridgeReceive();

const signerFactory: SignerFactory = (deviceId: string): Promise<Ada> => {
  return withDevicePromise(deviceId, (transport) => of(new Ada(transport)));
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync: sync(signerFactory),
  receive,
  assignToAccountRaw,
  assignFromAccountRaw,
  signOperation,
  broadcast,
};

const currencyBridge: CurrencyBridge = {
  scanAccounts: scanAccounts(signerFactory),
  preload: async () => ({}),
  hydrate: () => {},
};

export default { currencyBridge, accountBridge };
