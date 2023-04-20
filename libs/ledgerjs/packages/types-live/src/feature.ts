/**  Add others with union (e.g. "learn" | "market" | "foo") */
export type FeatureId =
  | "learn"
  | "brazePushNotifications"
  | "brazeLearn"
  | "llmNewDeviceSelection"
  | "llmUsbFirmwareUpdate"
  | "ratingsPrompt"
  | "counterValue"
  | "deviceLocalization"
  | "deviceInitialApps"
  | "buyDeviceFromLive"
  | "ptxSmartRouting"
  | "ptxEarn"
  | "currencyAvalancheCChain"
  | "ptxSmartRoutingMobile"
  | "mockFeature"
  | "multibuyNavigation"
  | "syncOnboarding"
  | "walletConnectLiveApp"
  | "walletConnectEntryPoint"
  | "customImage"
  | "referralProgramDiscoverCard"
  | "referralProgramDesktopBanner"
  | "disableNftSend"
  | "disableNftLedgerMarket"
  | "disableNftRaribleOpensea"
  | "walletNftGallery"
  | "receiveStakingFlowConfigDesktop"
  | "ethStakingProviders"
  | "storyly"
  | "staxWelcomeScreen"
  | "postOnboardingClaimNft"
  | "postOnboardingAssetsTransfer"
  | "firebaseEnvironmentReadOnly"
  | "protectServicesMobile"
  | "swapShowDexQuotes"
  | "stakePrograms"
  | "portfolioExchangeBanner"
  | "objkt"
  | "stakeAccountBanner"
  | "newsfeedPage"
  | "domainInputResolution"
  | "discover"
  | "protectServicesDiscoverDesktop";

/**  We use objects instead of direct booleans for potential future improvements
like feature versioning etc */
export type Feature<T = any> = {
  /** If false, the feature is disabled (for every languages regardless of the languages_whitelisted option) */
  enabled: boolean;
  /** The `desktop_version` option is desktop specific, it has no impact on mobile */
  /** If set, the feature is disabled when the desktop app version does not satisfies this param */
  /** It should respect the semantic versioning specification (https://semver.org/) */
  desktop_version?: string;
  /** Whether the remote value of `enabled` was overriden due to `desktop_version` */
  enabledOverriddenForCurrentDesktopVersion?: boolean;
  /** The `mobile_version` option is mobile specific, it has no impact on mobile */
  /** If set, the feature is disabled when the mobile app version does not satisfies this param */
  /** It should respect the semantic versioning specification (https://semver.org/) */
  mobile_version?: string;
  /** Whether the remote value of `enabled` was overriden due to `mobile_version` */
  enabledOverriddenForCurrentMobileVersion?: boolean;
  /** You can optionnally use one of the two following options (languages_whitelisted and languages_blacklisted) (Only implemented on mobile for now) */
  /** List of languages for which the feature is enabled (it will be disabled by default for all of the others) */
  languages_whitelisted?: [string];
  /** List of languages for which the feature is disabled */
  languages_blacklisted?: [string];
  /** Whether the remote value of `enabled` was overriden due to `languages_whitelisted` or `languages_blacklisted` */
  enabledOverriddenForCurrentLanguage?: boolean;
  /** Whether the remote value of this object was overriden locally */
  overridesRemote?: boolean;
  /** Whether the remote value of this object was overriden by an environment variable */
  overriddenByEnv?: boolean;
  /** Additional params */
  params?: T;
};

/** */
export type DefaultFeatures = { [key in FeatureId]?: Feature };
