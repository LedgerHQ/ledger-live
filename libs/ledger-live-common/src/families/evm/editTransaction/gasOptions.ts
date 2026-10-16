import { toJsonSafe } from "@ledgerhq/account-module-framework";
import type { GasOptions } from "@ledgerhq/coin-evm/types";
import { writeSide } from "@ledgerhq/portfolio-module-hybrid";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { Account } from "@ledgerhq/types-live";
import { getCoinModuleApi } from "../../../bridge/generic-coin-framework/api";
import { buildContext } from "../../../bridge/generic-coin-framework/api/context";
import { getBridgeApi } from "../../../bridge/generic-coin-framework/bridge";
import { buildGenericTransactionIntent } from "../../../bridge/generic-coin-framework/buildIntent";
import { openCurrencyPortfolio } from "../../../bridge/generic-coin-framework/networkPortfolio";
import { writeIntentApi } from "../../../bridge/generic-coin-framework/portfolio/intentApi";
import type { GenericTransaction } from "../../../bridge/generic-coin-framework/types";
import { toGasOptionsFromUnknown } from "../../../bridge/generic-coin-framework/utils";
import { getEvmDummyAddress } from "../constants";
import type { Transaction } from "../types";

/** A fee preset makes coin-evm's estimate answer the gas tracker's options with its own. */
const FEES_STRATEGY = "fast";

const gasOptionsOf = (parameters: unknown): GasOptions | undefined =>
  typeof parameters === "object" && parameters !== null
    ? toGasOptionsFromUnknown((parameters as { gasOptions?: unknown }).gasOptions)
    : undefined;

/**
 * The gas tracker's options for editing `transaction`, through the portfolio layer: the fee
 * estimate of the transaction, its intent built as `prepareTransaction` builds it, with a fee preset
 * and nothing else (gas options the transaction carries would be answered back instead of fresh
 * ones). Undefined when the estimate carries none (no gas tracker for the chain).
 */
export async function editedTransactionGasOptions(
  account: Account,
  transaction: Transaction,
): Promise<GasOptions | undefined> {
  const { currency } = account;
  const generic = transaction as unknown as GenericTransaction;
  const [coinModuleApi, bridgeApi, intent] = await Promise.all([
    getCoinModuleApi(currency.id, "local"),
    getBridgeApi(currency, currency.family),
    buildGenericTransactionIntent(currency.family, "local", account, generic),
  ]);
  const { parameters } = await writeIntentApi(bridgeApi, coinModuleApi, account, {
    ...generic,
  }).estimateFees(buildContext(currency.id), intent, {
    customFeesParameters: { feesStrategy: FEES_STRATEGY },
  });
  return gasOptionsOf(parameters);
}

/**
 * The gas tracker's options of a currency, through the portfolio layer, for a caller that knows no
 * account: the fee estimate of a native transfer of the given type, from and to the estimation
 * address, with its nonce and gas limit set so that the coin module reads the gas tracker only.
 * Undefined when the estimate carries none.
 */
export async function networkGasOptions(
  currency: CryptoCurrency,
  useEIP1559: boolean,
): Promise<GasOptions | undefined> {
  const { portfolio, network, mode } = await openCurrencyPortfolio(currency, "read");
  const estimationAddress = getEvmDummyAddress(currency.id);
  const networkParams = {
    sequence: 0n,
    feeParameters: { feesStrategy: FEES_STRATEGY, gasLimit: 21_000n },
  };
  const { parameters } = await portfolio.estimateTransactionFee(network, {
    intent: {
      type: useEIP1559 ? "send-eip1559" : "send-legacy",
      sender: estimationAddress,
      recipient: estimationAddress,
      amount: "0",
      asset: "native",
      feesStrategy: FEES_STRATEGY,
      // The local side takes them in memory, the service in their JSON form.
      networkParams: writeSide(mode) === "remote" ? toJsonSafe(networkParams) : networkParams,
    },
  });
  return gasOptionsOf(parameters);
}
