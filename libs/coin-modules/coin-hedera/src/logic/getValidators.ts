import type { Cursor, Page, Validator } from "@ledgerhq/coin-framework/api/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { apiClient } from "../network/api";
import { calculateAPY, extractCompanyFromNodeDescription } from "./utils";

export async function getValidators({
  currency,
  cursor,
}: {
  currency: CryptoCurrency;
  cursor: Cursor | undefined;
}): Promise<Page<Validator>> {
  const res = await apiClient.getNodes({
    currency,
    fetchAllPages: false,
    ...(cursor && { cursor }),
  });

  return {
    next: res.nextCursor ?? undefined,
    items: res.nodes.map(node => ({
      address: node.node_account_id,
      nodeId: node.node_id.toString(),
      name: extractCompanyFromNodeDescription(node.description),
      description: node.description,
      balance: BigInt(node.stake),
      apy: calculateAPY(node.reward_rate_start),
    })),
  };
}
