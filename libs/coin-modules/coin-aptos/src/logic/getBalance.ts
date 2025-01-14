import { node } from "../network";
import { APTOS_ASSET_ID } from "./constants";

export async function getBalance(address: string): Promise<bigint> {
  const client = await node();

  try {
    const [balanceStr] = await client.view<[string]>({
      payload: {
        function: "0x1::coin::balance",
        typeArguments: [APTOS_ASSET_ID],
        functionArguments: [address],
      },
    });
    const balance = parseInt(balanceStr, 10);

    return BigInt(balance);
  } catch (_) {
    return BigInt(0);
  }
}
