import { firstValueFrom, from } from "rxjs";
import type { AccountBridge, CurrencyBridge } from "@ledgerhq/types-live";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import Ada, { ExtendedPublicKey } from "@cardano-foundation/ledgerjs-hw-app-cardano";
import type { CardanoAccount, Transaction, TransactionStatus } from "../types";
import { assignToAccountRaw, assignFromAccountRaw } from "../serialization";
import { SignerContext, scanAccounts, sync } from "../synchronisation";
import { makeAccountBridgeReceive } from "../../../bridge/jsHelpers";
import { getTransactionStatus } from "../getTransactionStatus";
import estimateMaxSpendable from "../estimateMaxSpendable";
import { prepareTransaction } from "../prepareTransaction";
import { createTransaction } from "../createTransaction";
import { withDevice } from "../../../hw/deviceAccess";
import { signOperation } from "../signOperation";
import { broadcast } from "../broadcast";

const receive = makeAccountBridgeReceive();

const signerContext: SignerContext = (
  deviceId: string,
  fn: (signer) => Promise<ExtendedPublicKey>,
): Promise<ExtendedPublicKey> => {
  return firstValueFrom(withDevice(deviceId)(transport => from(fn(new Ada(transport)))));
};

const accountBridge: AccountBridge<Transaction, CardanoAccount, TransactionStatus> = {
  estimateMaxSpendable,
  createTransaction,
  updateTransaction: defaultUpdateTransaction,
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
