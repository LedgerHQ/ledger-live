import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import BigNumber from "bignumber.js";
import type { EvmConfigInfo } from "./config";
import { getNodeApi } from "./network/node/index";

/**
 * Helper returning the potential additional fees necessary for layer twos
 * to settle the transaction on layer 1.
 */
export const getAdditionalLayer2Fees = async (
  config: EvmConfigInfo,
  currency: CryptoCurrency,
  transaction: string,
): Promise<BigNumber | undefined> => {
  switch (currency.id) {
    case "optimism":
    case "optimism_sepolia":
    case "blast":
    case "blast_sepolia":
    case "base":
    case "base_sepolia": {
      const nodeApi = getNodeApi(config, currency);
      const additionalFees = await nodeApi.getOptimismAdditionalFees(currency, transaction);
      return additionalFees;
    }
    case "scroll": {
      const nodeApi = getNodeApi(config, currency);
      const additionalFees = await nodeApi.getScrollAdditionalFees(currency, transaction);
      return additionalFees;
    }
    default:
      return;
  }
};
