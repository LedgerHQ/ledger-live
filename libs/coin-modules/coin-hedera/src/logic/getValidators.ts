import type { Cursor, Page, Validator } from "@ledgerhq/coin-module-framework/api/types";
import type { HederaCoinConfig } from "../config";
import { apiClient } from "../network/api";
import { calculateAPY, extractCompanyFromNodeDescription } from "./utils";

export async function getValidators({
  configOrCurrencyId,
  cursor,
}: {
  configOrCurrencyId: HederaCoinConfig | string;
  cursor: Cursor | undefined;
}): Promise<Page<Validator>> {
  const res = await apiClient.getNodes({
    configOrCurrencyId,
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
