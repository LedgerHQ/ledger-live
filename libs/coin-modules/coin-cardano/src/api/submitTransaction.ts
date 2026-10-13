import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";
import { CARDANO_API_ENDPOINT, CARDANO_TESTNET_API_ENDPOINT } from "../constants";
import { isTestnet } from "../logic";

export async function submitTransaction({
  transaction,
  config,
}: {
  transaction: string;
  config: CardanoCoinConfig;
}): Promise<{ hash: string }> {
  const res = await network({
    method: "POST",
    url: isTestnet(config)
      ? `${CARDANO_TESTNET_API_ENDPOINT}/v1/transaction/submit`
      : `${CARDANO_API_ENDPOINT}/v1/transaction/submit`,
    data: {
      transaction: transaction,
    },
  });
  return res.data.transaction;
}
