import type { Feature_StakePrograms } from "@ledgerhq/types-live";

export const stakeProgramsToEarnParam = (stakePrograms: Feature_StakePrograms | null) => {
  const list = stakePrograms?.params?.list ?? [];
  const redirects = stakePrograms?.params?.redirects ?? {};
  const result: Record<string, string> = {};
  const keys = Object.keys(redirects);
  if (keys.length === 0) {
    return { stakeProgramsParam: undefined, stakeCurrenciesParam: [] };
  }
  keys.forEach(key => {
    result[key] = redirects[key].platform;
  });

  return { stakeProgramsParam: result, stakeCurrenciesParam: list };
};

type StablecoinYield = "dapp" | "api" | "inactive";

export const getStablecoinYieldSetting = (
  stakePrograms: Feature_StakePrograms | null,
): StablecoinYield => {
  /** Tether USDT provider is proxy for stablecoin flow rollout.  */
  const usdtProvider =
    !stakePrograms?.enabled || !stakePrograms?.params?.redirects
      ? undefined
      : stakePrograms?.params?.redirects["ethereum/erc20/usd_tether__erc20_"]?.platform;

  return !usdtProvider ? "inactive" : usdtProvider === "earn" ? "api" : "dapp";
};

type BitcoinYield = "deposit_screen" | "inactive";

export const getBitcoinYieldSetting = (
  stakePrograms: Feature_StakePrograms | null,
): BitcoinYield => {
  /** Check if Bitcoin has "earn" provider configured in redirects. */
  const bitcoinProvider =
    !stakePrograms?.enabled || !stakePrograms?.params?.redirects
      ? undefined
      : stakePrograms?.params?.redirects["bitcoin"]?.platform;

  return bitcoinProvider === "earn" ? "deposit_screen" : "inactive";
};
