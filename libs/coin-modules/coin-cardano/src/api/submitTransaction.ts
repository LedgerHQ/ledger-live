import network from "@ledgerhq/live-network/network";
import { getApiEndpoint } from "./endpoints";
import type { CardanoCoinConfig } from "../config";

export async function submitTransaction(
  config: CardanoCoinConfig,
  {
    transaction,
  }: {
    transaction: string;
  },
): Promise<{ hash: string }> {
  const res = await network({
    method: "POST",
    url: `${getApiEndpoint(config)}/v1/transaction/submit`,
    data: {
      transaction: transaction,
    },
  });
  return res.data.transaction;
}
