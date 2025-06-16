import { getNextSequence } from "../../network/node";

// Could be getAccountInfo so it is used in both bridge and api
export async function getNextValidSequence(address: string): Promise<number> {
  return await getNextSequence(address);
}
