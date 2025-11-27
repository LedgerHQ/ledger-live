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

export const getBitcoinYieldSetting = (stakePrograms: Feature_StakePrograms | null): string => {
  /** Check if Bitcoin has "earn" provider configured in redirects. */
  const bitcoinProvider =
    !stakePrograms?.enabled || !stakePrograms?.params?.redirects
      ? undefined
      : stakePrograms?.params?.redirects["bitcoin"]?.platform;

  return !bitcoinProvider
    ? "inactive"
    : bitcoinProvider === "earn"
      ? "deposit_screen"
      : bitcoinProvider;
};

export const getEthDepositScreenSetting = (stakePrograms: Feature_StakePrograms | null): string => {
  /** Check if Ethereum has "earn" provider configured in redirects with ethDepositCohort. */
  const ethereumRedirect = stakePrograms?.enabled
    ? stakePrograms?.params?.redirects?.["ethereum"]
    : undefined;

  // If no ethereum redirect exists, return "standard"
  // If platform is not "earn", return "standard"
  if (ethereumRedirect?.platform !== "earn") {
    return "standard";
  }

  // Extract ethDepositCohort from queryParams
  const ethDepositCohort = ethereumRedirect.queryParams?.ethDepositCohort;

  return ethDepositCohort ?? "missing_cohort_value";
};
