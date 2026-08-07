import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node";

export async function getBlockInfo(
  context: EvmContext,
  currency: CryptoCurrency,
  height: number,
): Promise<BlockInfo> {
  const config = await context.config(currency.id);
  const api = getNodeApi(config, currency);
  const result = await api.getBlockByHeight(currency, height);

  const blockInfo: BlockInfo = {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };

  if (height > 0 && result.parentHash && !/^0x0+$/.test(result.parentHash)) {
    blockInfo.parent = {
      height: result.height - 1,
      hash: result.parentHash,
    };
  }

  return blockInfo;
}
