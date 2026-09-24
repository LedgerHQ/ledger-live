import type { AccountBridge } from "@ledgerhq/types-live";
import { makeSync } from "../jsHelpers";
import { genericGetAccountShape } from "./getAccountShape";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getBridgeApi } from "./bridge";
import { getSigner } from "./signer";
import { genericPrepareTransaction } from "./prepareTransaction";
import { genericGetTransactionStatus } from "./getTransactionStatus";
import { genericEstimateMaxSpendable } from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import { genericBroadcast } from "./broadcast";
import { genericSignOperation } from "./signOperation";
import { genericSignRawOperation } from "./signRawOperation";
import { postSync } from "./postSync";
import { genericValidateAddress } from "./validateAddress";
import { getAccountRawAssignHooks } from "./accountRawAssign";
import type { GenericTransaction, CoinFrameworkSigner } from "./types";

export async function getCoinFrameworkAccountBridge(
  network: string,
  kind: string,
  customSigner?: CoinFrameworkSigner,
): Promise<AccountBridge<GenericTransaction>> {
  const signer = customSigner ?? (await getSigner(network));
  const {
    assignFromAccountRaw,
    assignToAccountRaw,
    assignFromTokenAccountRaw,
    assignToTokenAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
  } = await getAccountRawAssignHooks(network);
  return {
    sync: makeSync({
      getAccountShape: genericGetAccountShape(network, kind),
      postSync,
      shouldMergeOps: async account => {
        const bridgeApi = await getBridgeApi(account.currency, network);
        return bridgeApi.shouldMergeOps ?? true;
      },
    }),
    receive: makeAccountBridgeReceive(getAddressWrapper(signer.getAddress), {
      getAddressLookup: async currency => {
        const bridgeApi = await getBridgeApi(currency, network);
        return bridgeApi.addressLookup;
      },
    }),
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
    assignFromTokenAccountRaw,
    assignToTokenAccountRaw,
    fromOperationExtraRaw,
    toOperationExtraRaw,
    getSerializedAddressParameters, // NOTE: check whether it should be exposed by coin-module's api instead?
    validateAddress: genericValidateAddress(network, kind),
  } satisfies Partial<AccountBridge<GenericTransaction>>;
}
