import type { AccountBridge } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { createApi as createEvmApi } from "@ledgerhq/coin-evm/api/index";
import type { EvmConfig, EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import { makeSync } from "../jsHelpers";
import { genericGetAccountShape } from "./getAccountShape";
import {
  getSerializedAddressParameters,
  makeAccountBridgeReceive,
  updateTransaction,
} from "@ledgerhq/ledger-wallet-framework/bridge/jsHelpers";
import getAddressWrapper from "@ledgerhq/ledger-wallet-framework/bridge/getAddressWrapper";
import { getCoinModuleApi } from "./api";
import { getCurrencyConfiguration } from "../../config";
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
import type { GenericTransaction, CoinFrameworkSigner } from "./types";

/**
 * Returns an EvmConfig with all retry budgets set to 0.
 * Used for `isEmpty` so a misbehaving chain can't slow the cross-EVM probe.
 */
function evmConfigWithoutRetries(config: EvmConfig): EvmConfig {
  return {
    ...config,
    node:
      config.node.type === "external"
        ? { ...config.node, retries: 0 }
        : { ...config.node, retries: 0 },
    explorer:
      config.explorer.type === "none"
        ? config.explorer
        : { ...config.explorer, retries: 0 },
  };
}

export async function alpacaIsEmpty(
  kind: string,
  currency: CryptoCurrency,
  address: string,
): Promise<boolean> {
  // EVM: build a one-shot api with retries disabled so a failing chain returns quickly.
  // We bypass the alpaca cache by calling createApi directly with a no-retries config.
  if (currency.family === "evm") {
    const original = getCurrencyConfiguration<EvmConfigInfo>(currency.id);
    const api = createEvmApi(evmConfigWithoutRetries(original), currency.id);
    try {
      const { items } = await api.listOperations(address, { minHeight: 0, limit: 1 });
      return items.length === 0;
    } finally {
      // Restore the original config so subsequent syncs use the normal retries budget.
      createEvmApi(original, currency.id);
    }
  }

  const coinModuleApi = await getCoinModuleApi(currency.id, kind);
  const { items } = await coinModuleApi.listOperations(address, { minHeight: 0, limit: 1 });
  return items.length === 0;
}

export function getCoinFrameworkAccountBridge(
  network: string,
  kind: string,
  customSigner?: CoinFrameworkSigner,
): AccountBridge<GenericTransaction> {
  const signer = customSigner ?? getSigner(network);
  const { assignFromAccountRaw, assignToAccountRaw } = getAccountRawAssignHooks(network);
  return {
    sync: makeSync({ getAccountShape: genericGetAccountShape(network, kind), postSync }),
    isEmpty: (currency, address) => alpacaIsEmpty(kind, currency, address),
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
