import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";

export function parseA4Asset(assetPath: string, owner: string): AssetInfo {
  if (assetPath === "native") return { type: "native" };

  const [type, second, third] = assetPath.split(".");

  if (type === "token" && second && third) {
    return { type: second, assetReference: third, assetOwner: owner };
  }

  if (second) {
    return { type, assetReference: second, assetOwner: owner };
  }

  return { type };
}
