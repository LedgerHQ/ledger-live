import type { Transaction } from "../types";
import { SignerContext, scanAccounts, sync } from "../js-synchronisation";
import estimateMaxSpendable from "../js-estimateMaxSpendable";
import { createTransaction, prepareTransaction, updateTransaction } from "../js-transaction";
import getTransactionStatus from "../js-getTransactionStatus";
import signOperation from "../js-signOperation";
import broadcast from "../js-broadcast";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import Ada, { ExtendedPublicKey } from "@cardano-foundation/ledgerjs-hw-app-cardano";
import { withDevice } from "../../../hw/deviceAccess";
import { from } from "rxjs";

const receive = makeAccountBridgeReceive();

const signerContext: SignerContext = (
  deviceId: string,
  fn: (signer) => Promise<ExtendedPublicKey>,
): Promise<ExtendedPublicKey> => {
  return withDevice(deviceId)(transport => from(fn(new Ada(transport)))).toPromise();
};

const accountBridge: AccountBridge<Transaction> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction,
  getTransactionStatus,
  prepareTransaction,
  sync: sync(signerContext),
  receive,
  assignToAccountRaw,
  assignFromAccountRaw,
  signOperation,
  broadcast,
};

const currencyBridge: CurrencyBridge = {
  scanAccounts: scanAccounts(signerContext),
  preload: async () => ({}),
  hydrate: () => {},
};

export default { currencyBridge, accountBridge };
