import { Block } from "@aptos-labs/ts-sdk";
import network from "@ledgerhq/live-network/lib/index";

export async function getHeight(): Promise<number> {
  getConfigu
  const { data } = await network<Block>({
    method: "GET",
    url: this.apiUrl,
  });
  return parseInt(data.block_height);
}
