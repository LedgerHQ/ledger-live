import network from "@ledgerhq/live-network/network";
import type { CardanoCoinConfig } from "../config";

export async function submitTransaction({
  transaction,
  config,
}: {
  transaction: string;
  config: CardanoCoinConfig;
}): Promise<{ hash: string }> {
  const res = await network({
    method: "POST",
    url: `${config.infra.CARDANO_API_ENDPOINT}/v1/transaction/submit`,
    data: {
      transaction: transaction,
    },
  });
  return res.data.transaction;
}
