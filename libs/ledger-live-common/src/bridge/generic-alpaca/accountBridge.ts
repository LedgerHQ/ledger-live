import type { AccountBridge } from "@ledgerhq/types-live";
import { makeSync } from "../jsHelpers";
import { genericGetAccountShape } from "./getAccountShape";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getSigner } from "./signer";
import { genericPrepareTransaction } from "./prepareTransaction";
import { genericGetTransactionStatus } from "./getTransactionStatus";
import { genericEstimateMaxSpendable } from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import { genericBroadcast } from "./broadcast";
import { genericSignOperation } from "./signOperation";
import { genericSignRawOperation } from "./signRawOperation";
import { postSync } from "./postSync";
import { getValidateAddress } from "./validateAddress";
import { getAccountRawAssignHooks } from "./accountRawAssign";
import type { GenericTransaction, AlpacaSigner } from "./types";

export function getAlpacaAccountBridge(
  network: string,
  kind: string,
  customSigner?: AlpacaSigner,
): AccountBridge<GenericTransaction> {
  const signer = customSigner ?? getSigner(network);
  const { assignFromAccountRaw, assignToAccountRaw } = getAccountRawAssignHooks(network);
  return {
    sync: makeSync({ getAccountShape: genericGetAccountShape(network, kind), postSync }),
    receive: makeAccountBridgeReceive(getAddressWrapper(signer.getAddress)),
    createTransaction: createTransaction,
    updateTransaction: updateTransaction<GenericTransaction>,
    prepareTransaction: genericPrepareTransaction(network, kind),
    getTransactionStatus: genericGetTransactionStatus(network, kind),
    estimateMaxSpendable: genericEstimateMaxSpendable(network, kind),
    broadcast: genericBroadcast(network, kind),
    signOperation: genericSignOperation(network, kind)(signer.context),
    signRawOperation: genericSignRawOperation(network, kind)(signer.context),
    assignFromAccountRaw,
    assignToAccountRaw,
    getSerializedAddressParameters, // NOTE: check whether it should be exposed by coin-module's api instead?
    validateAddress: getValidateAddress(network),
  } satisfies Partial<AccountBridge<GenericTransaction>>;
}
