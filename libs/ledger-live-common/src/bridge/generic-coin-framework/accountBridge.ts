import type { AccountBridge } from "@ledgerhq/types-live";
import { makeSync } from "../jsHelpers";
import { genericGetAccountShape } from "./getAccountShape";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getBridgeApi, getBridgeApiResolver } from "./bridge";
import { getSigner } from "./signer";
import { genericPrepareTransaction } from "./prepareTransaction";
import { genericGetTransactionStatus } from "./getTransactionStatus";
import { genericEstimateMaxSpendable } from "./estimateMaxSpendable";
import { createTransaction } from "./createTransaction";
import { updateTransaction } from "./updateTransaction";
import { genericBroadcast } from "./broadcast";
import { genericSignOperation } from "./signOperation";
import { genericSignRawOperation } from "./signRawOperation";
import { postSync } from "./postSync";
import { accountModulePostSync } from "./accountModule";
import { genericValidateAddress } from "./validateAddress";
import { getAccountRawAssignHooks } from "./accountRawAssign";
import { bindAddressLookup } from "./chainReads";
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
  const resolveBridgeApi = await getBridgeApiResolver(network);
  return {
    sync: makeSync({
      getAccountShape: genericGetAccountShape(network, kind, signer),
      postSync: (initial, synced) => {
        const binding = resolveBridgeApi(synced.currency).accountModule;
        return binding ? accountModulePostSync(binding, synced) : postSync(initial, synced);
      },
      // Defaults to `false`: the shape already returns the merged list. Left on, the outer
      // `mergeOps(stored, shape.operations)` re-adds every operation the store bound just dropped,
      // undoing it, and resurrects the history a from-scratch resync deliberately discarded. A
      // family that opts back in gives up the store bound.
      shouldMergeOps: async account => {
        const bridgeApi = await getBridgeApi(account.currency, network);
        return bridgeApi.shouldMergeOps ?? false;
      },
    }),
    receive: makeAccountBridgeReceive(getAddressWrapper(signer.getAddress), {
      getAddressLookup: async currency => {
        const { addressLookup } = await getBridgeApi(currency, network);
        return addressLookup && bindAddressLookup(addressLookup, currency);
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
    // NOTE: check whether it should be exposed by coin-module's api instead?
    getSerializedAddressParameters: (account, addressFormat) => {
      const fromFamily = resolveBridgeApi(account.currency).accountModule
        ?.getSerializedAddressParameters;
      return fromFamily
        ? fromFamily(account, addressFormat)
        : getSerializedAddressParameters(account);
    },
    validateAddress: genericValidateAddress(network, kind),
  } satisfies Partial<AccountBridge<GenericTransaction>>;
}
