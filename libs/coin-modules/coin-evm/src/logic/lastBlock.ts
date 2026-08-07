import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node";

export async function lastBlock(context: EvmContext, currency: CryptoCurrency): Promise<BlockInfo> {
  const config = await context.config(currency.id);
  const api = getNodeApi(config, currency);
  const { finalizationLevel = "latest" } = config;
  const result = await api.getBlockByHeight(currency, finalizationLevel);

  return {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };
}
