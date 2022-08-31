/**  Add others with union (e.g. "learn" | "market" | "foo") */
export type FeatureId =
  | "learn"
  | "pushNotifications"
  | "llmUsbFirmwareUpdate"
  | "ratings"
  | "counterValue"
  | "buyDeviceFromLive"
  | "ptxSmartRouting"
  | "currencyOsmosis"
  | "currencyOsmosisMobile"
  | "currencyFantom"
  | "currencyMoonbeam"
  | "currencyCronos"
  | "currencySongbird"
  | "currencyFlare"
  | "currencyFantomMobile"
  | "currencyMoonbeamMobile"
  | "currencyCronosMobile"
  | "currencySongbirdMobile"
  | "currencyFlareMobile"
  | "ptxSmartRoutingMobile"
  | string;

/**  We use objects instead of direct booleans for potential future improvements
like feature versioning etc */
export type Feature = {
  /** If false, the feature is disabled (for every languages regardless of the languages_whitelisted option) */
  enabled: boolean;
  /** You can optionnally use one of the two following options (languages_whitelisted and languages_blacklisted) (Only implemented on mobile for now) */
  /** List of languages for which the feature is enabled (it will be disabled by default for all of the others) */
  languages_whitelisted?: [string];
  /** List of languages for which the feature is disabled */
  languages_blacklisted?: [string];
  /** Whether the remote value of `enabled` was overriden due to `languages_whitelisted` or `languages_blacklisted` */
  enabledOverriddenForCurrentLanguage?: boolean;
  /** Whether the remote value of this object was overriden locally */
  overridesRemote?: boolean;
  /** Additional params */
  params?: any;
};

/** */
export type DefaultFeatures = { [key in FeatureId]: Feature };
