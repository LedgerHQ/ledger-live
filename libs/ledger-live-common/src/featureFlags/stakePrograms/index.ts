import type { Feature_StakePrograms, PlatformManifestId } from "@ledgerhq/types-live";

export const stakeProgramsToEarnParam = (
  stakePrograms: Feature_StakePrograms,
): Record<PlatformManifestId, string> | undefined => {
  const redirects = stakePrograms?.params?.redirects ?? {};
  const result: Record<string, string> = {};
  const keys = Object.keys(redirects);
  if (keys.length === 0) {
    return undefined;
  }
  keys.forEach(key => {
    result[key] = redirects[key].platform;
  });

  return result;
};

type StablecoinYield = "dapp" | "api" | "inactive";

export const getStablecoinYieldSetting = (
  stakePrograms: Feature_StakePrograms,
): StablecoinYield => {
  /** Tether USDT provider is proxy for stablecoin flow rollout.  */
  const usdtProvider =
    !stakePrograms?.enabled || !stakePrograms?.params?.redirects
      ? undefined
      : stakePrograms?.params?.redirects["ethereum/erc20/usd_tether__erc20_"]?.platform;

  return !usdtProvider ? "inactive" : usdtProvider === "earn" ? "api" : "dapp";
};
