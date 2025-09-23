import type {
  Account,
  DeviceInfo,
  DeviceModelInfo,
  Feature,
  FeatureId,
  PortfolioRange,
} from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { PostOnboardingState } from "@ledgerhq/types-live";
import { AvailableProviderV3, ExchangeRate } from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type { EventTrigger, DataOfUser } from "../logic/notifications";
import type { RatingsHappyMoment, RatingsDataOfUser } from "../logic/ratings";
import { WalletTabNavigatorStackParamList } from "../components/RootNavigator/types/WalletTabNavigator";
import {
  WalletContentCard,
  AssetContentCard,
  NotificationContentCard,
  CategoryContentCard,
  BrazeContentCard,
  LandingPageStickyCtaContentCard,
} from "../dynamicContent/types";
import { ProtectStateNumberEnum } from "../components/ServicesWidget/types";
import { ImageType } from "../components/CustomImage/types";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { TrustchainStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import { Steps } from "LLM/features/WalletSync/types/Activation";
import { type TabListType as TabPortfolioAssetsType } from "~/screens/Portfolio/useListsAnimation";
import { CountervaluesState } from "./countervalues";
import { ToastState } from "./toast";
import { ModularDrawerState } from "./modularDrawer";
import { assetsDataApi } from "@ledgerhq/live-common/modularDrawer/data/state-manager/api";

// === ACCOUNT STATE ===

export type AccountsState = {
  active: Account[];
};

// === APP STATE ===

export type FwUpdateBackgroundEvent =
  | {
      type: "confirmPin";
    }
  | {
      type: "downloadingUpdate";
      progress?: number;
    }
  | {
      type: "confirmUpdate";
    }
  | {
      type: "flashingMcu";
      progress?: number;
      installing?: string | null;
    }
  | {
      type: "firmwareUpdated";
      updatedDeviceInfo?: DeviceInfo;
    }
  | {
      type: "error";
      error: Error;
    }
  | {
      type: "log";
      message: string;
    };

export type AppState = {
  debugMenuVisible: boolean;
  isConnected: boolean | null;
  hasConnectedDevice: boolean;
  modalLock: boolean;
  backgroundEvents: Array<FwUpdateBackgroundEvent>;
  isMainNavigatorVisible: boolean;
  /** For deep links that inadvertently trigger privacy lock. Reset to false on close. */
  isPasswordLockBlocked: boolean;
  /** Reboot ID for triggering app remount */
  rebootId: number;
};

// === AUTH STATE ===

export type AuthState = {
  isLocked: boolean;
  biometricsError: Error | null;
  authModalOpen: boolean;
};

// === BLE STATE ===

export type DeviceLike = {
  id: string;
  name: string;
  deviceInfo?: DeviceInfo;
  appsInstalled?: number;
  modelId: DeviceModelId;
};

export type BleState = {
  knownDevices: DeviceLike[];
};

// === NOTIFICATIONS STATE ===

export type NotificationsState = {
  /** Boolean indicating whether the push notifications modal is opened or closed */
  isPushNotificationsModalOpen: boolean;
  /** Type of the push notifications modal to display (either the generic one or the market one) */
  notificationsModalType: string;
  /** The route name of the current screen displayed in the app, it is updated every time the displayed screen change */
  currentRouteName?: string;
  /** The event that triggered the oppening of the push notifications modal */
  eventTriggered?: EventTrigger;
  /** Data related to the user's app usage. We use this data to prompt the push notifications modal on certain conditions only */
  dataOfUser?: DataOfUser;
  /**
   * Used to avoid having multiple different modals opened at the same time (for example the push notifications and the ratings ones)
   * If true, it means another modal is already opened or being opened
   */
  isPushNotificationsModalLocked: boolean;
};

// === DYNAMIC CONTENT STATE ===

export type DynamicContentState = {
  /** Dynamic content cards displayed in the Wallet Page */
  walletCards: WalletContentCard[];
  /** Dynamic content cards displayed in an Asset Page */
  assetsCards: AssetContentCard[];
  /** Dynamic content cards displayed in Notification Center */
  notificationCards: NotificationContentCard[];
  /** Dynamic content cards handling flexible categories throughout the app */
  categoriesCards: CategoryContentCard[];
  /** Dynamic content cards displayed in the landing page as sticky CTA */
  landingPageStickyCtaCards: LandingPageStickyCtaContentCard[];
  /** Dynamic content cards for Ledger Live Mobile */
  mobileCards: BrazeContentCard[];
  /** Check if CC are loading */
  isLoading: boolean;
};

// === IN VIEW STATE ===

export type InViewState = {
  hasItems: boolean;
};

// === RATINGS STATE ===

export type RatingsState = {
  /** Boolean indicating whether the ratings flow modal is opened or closed */
  isRatingsModalOpen: boolean;

  /** The route name of the current screen displayed in the app, it is updated every time the displayed screen change */
  currentRouteName?: string | null;

  /** The happy moment that triggered the oppening of the ratings modal */
  happyMoment?: RatingsHappyMoment;

  /** Data related to the user's app usage. We use this data to prompt the rating flow on certain conditions only */
  dataOfUser?: RatingsDataOfUser;

  /**
   * Used to avoid having multiple different modals opened at the same time (for example the push notifications and the ratings ones)
   * If true, it means another modal is already opened or being opened
   */
  isRatingsModalLocked: boolean;
};

// === SETTINGS STATE ===

export enum OnboardingType {
  restore = "restore",
  connect = "connect",
  setupNew = "setup new",
  walletSync = "wallet sync",
}

export type CurrencySettings = {
  confirmationsNb: number;
  unit: Unit;
};

export type Privacy = {
  // Is a password setted by the user ?
  hasPassword: boolean;
  // when we set the privacy, we also retrieve the biometricsType info
  biometricsType?: string | null;
  // this tells if the biometrics was enabled by user yet
  biometricsEnabled: boolean;
};

export type Pair = {
  from: Currency;
  to: Currency;
  exchange?: string | null;
};

export type Theme = "system" | "light" | "dark";

export type supportedCountervaluesData = {
  value: string;
  ticker: string;
  label: string;
  currency: Currency;
};

export type SettingsState = {
  counterValue: string;
  counterValueExchange: string | null | undefined;
  reportErrorsEnabled: boolean;
  analyticsEnabled: boolean;
  personalizedRecommendationsEnabled: boolean;
  privacy: Privacy | null | undefined;
  currenciesSettings: Record<string, CurrencySettings>;
  pairExchanges: Record<string, string | null | undefined>;
  selectedTimeRange: PortfolioRange;
  orderAccounts: string;
  hasCompletedCustomImageFlow: boolean;
  hasCompletedOnboarding: boolean;
  isOnboardingFlow: boolean;
  hasInstalledAnyApp: boolean;
  readOnlyModeEnabled: boolean;
  hasOrderedNano: boolean;
  countervalueFirst: boolean;
  graphCountervalueFirst: boolean;
  hideEmptyTokenAccounts: boolean;
  filterTokenOperationsZeroAmount: boolean;
  blacklistedTokenIds: string[];
  dismissedBanners: string[];
  hasAvailableUpdate: boolean;
  theme: Theme;
  osTheme: string | null | undefined;
  dismissedDynamicCards: string[];
  // number is the legacy type from LLM V2
  discreetMode: boolean;
  language: string;
  languageIsSetByUser: boolean;
  locale: string | null | undefined;
  swap: {
    hasAcceptedIPSharing: false;
    acceptedProviders: string[];
    selectableCurrencies: string[];
  };
  seenDevices: DeviceModelInfo[];
  knownDeviceModelIds: Record<DeviceModelId, boolean>;
  lastConnectedDevice: Device | null;
  sensitiveAnalytics: boolean;
  onboardingHasDevice: boolean | null;
  isReborn: boolean | null;
  onboardingType: OnboardingType | null;
  customLockScreenType: ImageType | null;

  lastSeenCustomImage: {
    size: number;
    hash: string;
  };
  notifications: NotificationsSettings;
  /** True if user never clicked on the AllowNotifications button in the notifications settings */
  neverClickedOnAllowNotificationsButton: boolean;
  walletTabNavigatorLastVisitedTab: keyof WalletTabNavigatorStackParamList;
  overriddenFeatureFlags: { [key in FeatureId]?: Feature | undefined };
  featureFlagsBannerVisible: boolean;
  debugAppLevelDrawerOpened: boolean;
  dateFormat: string;
  /* NB: Protect is the former codename for Ledger Recover */
  hasBeenUpsoldProtect: boolean;
  hasBeenRedirectedToPostOnboarding: boolean;
  generalTermsVersionAccepted?: string;
  depositFlow: {
    hasClosedNetworkBanner: boolean;
    hasClosedWithdrawBanner: boolean;
  };
  userNps: number | null;
  supportedCounterValues: supportedCountervaluesData[];
  hasSeenAnalyticsOptInPrompt: boolean;
  dismissedContentCards: { [id: string]: number };
  starredMarketCoins: string[];
  fromLedgerSyncOnboarding: boolean;
  mevProtection: boolean;
  selectedTabPortfolioAssets: TabPortfolioAssetsType;
  rtkConsoleEnabled?: boolean;
};

export type NotificationsSettings = {
  areNotificationsAllowed: boolean;
  announcementsCategory: boolean;
  largeMoverCategory: boolean;
  transactionsAlertsCategory: boolean;
};

// === WALLET CONNECT STATE ===

export type WalletConnectState = {
  uri?: string;
};

// === SWAP STATE ===

export type SwapStateType = {
  providers?: AvailableProviderV3[];
  pairs?: AvailableProviderV3["pairs"];
  transaction?: Transaction;
  exchangeRate?: ExchangeRate;
  exchangeRateExpiration?: Date;
};

// === EARN STATE ===

export type OptionMetadata = { button: string; live_app: string; flow: string; link?: string };

export type EarnState = {
  infoModal: {
    message?: string;
    messageTitle?: string;
    learnMoreLink?: string;
  };
  menuModal?: {
    title?: string;
    options: { label: string; metadata: OptionMetadata }[];
  };
  protocolInfoModal?: true;
};

// === PROTECT STATE ===

export type ProtectData = {
  services: {
    Protect: {
      available: boolean;
      active: boolean;
      paymentDue: boolean;
      subscribedAt: number;
      lastPaymentDate: number;
    };
  };
  accessToken: string;
  expiresIn: number;
  refreshExpiresIn: number;
  refreshToken: string;
  tokenType: string;
};

export type ProtectState = {
  data: ProtectData;
  protectStatus: ProtectStateNumberEnum;
};

// === MARKET STATE ===

export type MarketState = {
  marketParams: MarketListRequestParams;
  marketFilterByStarredCurrencies: boolean;
  marketCurrentPage: number;
};

// === WALLETSYNC STATE ===

export type WalletSyncState = {
  isManageKeyDrawerOpen: boolean;
  isActivateDrawerOpen: boolean;
  activateDrawerStep: Steps;
};

// === LARGEMOVER STATE ===

export type LargeMoverState = {
  tutorial: boolean;
};

// === ROOT STATE ===

export type State = {
  accounts: AccountsState;
  appstate: AppState;
  assetsDataApi: ReturnType<typeof assetsDataApi.reducer>;
  auth: AuthState;
  ble: BleState;
  countervalues: CountervaluesState;
  dynamicContent: DynamicContentState;
  earn: EarnState;
  inView: InViewState;
  largeMover: LargeMoverState;
  market: MarketState;
  modularDrawer: ModularDrawerState;
  notifications: NotificationsState;
  postOnboarding: PostOnboardingState;
  protect: ProtectState;
  ratings: RatingsState;
  settings: SettingsState;
  swap: SwapStateType;
  toasts: ToastState;
  trustchain: TrustchainStore;
  wallet: WalletState;
  walletconnect: WalletConnectState;
  walletSync: WalletSyncState;
};
