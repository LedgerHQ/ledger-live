import { getNextSequence as getNextSequenceFromNode } from "../network/node";

// Could be getAccountInfo so it is used in both bridge and api
export async function getNextSequence(address: string): Promise<number> {
  return await getNextSequenceFromNode(address);
}
