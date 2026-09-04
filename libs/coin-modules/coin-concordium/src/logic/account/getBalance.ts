import type { Balance } from "@ledgerhq/coin-module-framework/api/types";
import { log } from "@ledgerhq/logs";
import { getAccountBalance } from "../../network/proxyClient";
import type { ConcordiumCoinConfig, PltAccountToken } from "../../types";

/**
 * The bridge guards the same fields through `isUsableEntry`. This surface reads
 * the same unvalidated response and needs its own guard, or one malformed entry
 * would throw and discard the native CCD balance with it.
 */
function toPltBalance(entry: PltAccountToken, address: string): Balance | undefined {
  const tokenId = entry?.token?.tokenId;
  const rawValue = entry?.tokenAccountState?.balance?.value;

  if (typeof tokenId !== "string" || tokenId.length === 0) return undefined;

  let value: bigint;
  try {
    value = BigInt(rawValue);
  } catch {
    log("concordium-api", `PLT ${tokenId} has an unusable balance, omitting it`);
    return undefined;
  }

  return {
    asset: { type: "plt", assetReference: tokenId, assetOwner: address },
    value,
  };
}

export async function getBalance(
  config: ConcordiumCoinConfig,
  address: string,
  currencyId: string,
): Promise<Balance[]> {
  const balanceResponse = await getAccountBalance(config, currencyId, address);
  const { accountAmount, accountTokens } = balanceResponse.finalizedBalance;

  const native: Balance = { asset: { type: "native" }, value: BigInt(accountAmount) };

  // Unlike the bridge, this surface reports what the chain says and holds no
  // prior state, so an absent list is simply no token balances. The response is
  // not runtime-validated, hence the array check rather than a bare access.
  if (!Array.isArray(accountTokens)) return [native];

  const plt = accountTokens
    .map(entry => toPltBalance(entry, address))
    .filter((balance): balance is Balance => balance !== undefined);

  return [native, ...plt];
}
