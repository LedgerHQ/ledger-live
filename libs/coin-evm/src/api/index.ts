import { log } from "@ledgerhq/logs";
import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import type { LRUCacheFn } from "@ledgerhq/coin-framework/cache";
import { ERC20Token } from "@ledgerhq/cryptoassets/types";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { tokens as tokensByChainId } from "@ledgerhq/cryptoassets/data/evm/index";

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

    const tokens = tokensByChainId[ethereumLikeInfo?.chainId || ""];
    if (tokens) return tokens;

    log(
      "warning",
      `EVM Family: No tokens found in CAL for currency: ${currency.id}`,
      currency
    );
    return [];
  }
}
