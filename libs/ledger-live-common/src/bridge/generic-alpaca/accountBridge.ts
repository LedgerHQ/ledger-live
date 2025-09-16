import { AccountBridge } from "@ledgerhq/types-live";
import { makeSync } from "../jsHelpers";
import { genericGetAccountShape } from "./getAccountShape";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  updateTransaction,
} from "@ledgerhq/coin-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/coin-framework/bridge/getAddressWrapper";
import { getSigner } from "./signer";
import { genericPrepareTransaction } from "./prepareTransaction";
import { genericGetTransactionStatus } from "./getTransactionStatus";
import { genericEstimateMaxSpendable } from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import { genericBroadcast } from "./broadcast";
import { genericSignOperation } from "./signOperation";
import type { AlpacaSigner } from "./signer/types";

export function getAlpacaAccountBridge(
  network: string,
  kind: string,
  customSigner?: AlpacaSigner,
): AccountBridge<any> {
  const signer = customSigner ?? getSigner(network);
  return {
    sync: makeSync({ getAccountShape: genericGetAccountShape(network, kind) }),
    receive: makeAccountBridgeReceive(getAddressWrapper(signer.getAddress)),
    createTransaction: createTransaction,
    updateTransaction: updateTransaction<any>,
    prepareTransaction: genericPrepareTransaction(network, kind),
    getTransactionStatus: genericGetTransactionStatus(network, kind),
    estimateMaxSpendable: genericEstimateMaxSpendable(network, kind),
    broadcast: genericBroadcast(network, kind),
    signOperation: genericSignOperation(network, kind)(signer.context),
    getSerializedAddressParameters, // NOTE: check wether it should be exposed by coin-module's api instead?
  } satisfies Partial<AccountBridge<any>>;
}
