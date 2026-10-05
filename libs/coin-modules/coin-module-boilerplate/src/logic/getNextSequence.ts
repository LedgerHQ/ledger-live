import type { BoilerplateCoinConfig } from "../config";
import { getNextSequence as getNextSequenceFromNode } from "../network/node";

// Could be getAccountInfo so it is used in both bridge and api
export async function getNextSequence(
  config: BoilerplateCoinConfig,
  address: string,
): Promise<number> {
  return await getNextSequenceFromNode(config, address);
}
