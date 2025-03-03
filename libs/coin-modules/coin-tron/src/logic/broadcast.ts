import { broadcastHexTron } from "../network";

export function broadcast(transaction: string): Promise<string> {
  return broadcastHexTron(transaction);
}
