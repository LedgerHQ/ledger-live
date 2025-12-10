import { getNextSequence } from "../../network/node";

export async function getNextValidSequence(address: string): Promise<number> {
  return await getNextSequence(address);
}
