import type { LRUCacheFn } from "@ledgerhq/coin-framework/cache";
import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { tokens as tokensByChainId } from "@ledgerhq/cryptoassets/data/evm/index";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import { getEnv } from "@ledgerhq/live-env";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import { Transaction } from "../types";
import createEtherscanLikeApi from "./etherscan";
import { getOptimismAdditionalFees } from "./rpc.common";
export class EvmAPI {
  network: NetworkRequestCall;
  cache: LRUCacheFn;

  constructor(network: NetworkRequestCall, cache: LRUCacheFn) {
    this.network = network;
    this.cache = cache;
  }

  async fetchERC20Tokens({
    currency,
  }: {
    currency: CryptoCurrency;
  }): Promise<ERC20Token[]> {
    const { ethereumLikeInfo } = currency;

    const url = `${getEnv("DYNAMIC_CAL_BASE_URL")}/evm/${
      ethereumLikeInfo?.chainId || 0
    }/erc20.json`;
    const dynamicTokens: ERC20Token[] | null = await this.network({
      method: "GET",
      url,
    })
      .then(({ data }: { data: ERC20Token[] }) => (data.length ? data : null))
      .catch((e) => {
        log(
          "error",
          "EVM Family: Couldn't fetch dynamic CAL tokens from " + url,
          e
        );
        return null;
      });
    if (dynamicTokens) return dynamicTokens;

    // @ts-expect-error FIXME: fix typings
    const tokens = tokensByChainId[ethereumLikeInfo?.chainId || ""];
    if (tokens) return tokens;

    log(
      "warning",
      `EVM Family: No tokens found in CAL for currency: ${currency.id}`,
      currency
    );
    return [];
  }

  async getOptimismAdditionalFees(
    currency: CryptoCurrency,
    transaction: Transaction
  ): Promise<BigNumber> {
    return getOptimismAdditionalFees(this.cache)(currency, transaction);
  }

  /**
   * Switch to select one of the compatible explorer
   */
  getExplorerApi(currency: CryptoCurrency) {
    const apiType = currency.ethereumLikeInfo?.explorer?.type;

    switch (apiType) {
      case "etherscan":
      case "blockscout":
        return createEtherscanLikeApi(this.cache);

      default:
        throw new Error("API type not supported");
    }
  }
}
