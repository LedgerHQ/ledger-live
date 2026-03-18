import RNLocalize from "react-native-localize";

export const getCountryLocale = () => RNLocalize.getCountry();

/** Returns `"yield"` for GB-based users, `"earn"` otherwise. */
export const getEarnOrYieldSuffix = (): "yield" | "earn" =>
  getCountryLocale() === "GB" ? "yield" : "earn";

export const getStakeLabelLocaleBased = () => `account.${getEarnOrYieldSuffix()}` as const;
