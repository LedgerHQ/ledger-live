import hash from "imurmurhash";
import { getCryptoAssetsStore } from "../crypto-assets";

export async function getSyncHash(
  currencyId: string,
  blacklistedTokenIds: string[] | undefined = [],
): Promise<string> {
  const tokensHash = await getCryptoAssetsStore().getTokensSyncHash(currencyId);
  const sortedIds = [...blacklistedTokenIds].sort();
  const combination = `${tokensHash}${sortedIds.join("")}`;
  return `0x${hash(combination).result().toString(16)}`;
}
