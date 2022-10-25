import type {
  Account,
  DeviceInfo,
  DeviceModelInfo,
  PortfolioRange,
} from "@ledgerhq/types-live";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { PostOnboardingState } from "@ledgerhq/types-live";
import {
  AvailableProviderV3,
  ExchangeRate,
  KYCStatus,
} from "@ledgerhq/live-common/exchange/swap/types";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import type { EventTrigger, DataOfUser } from "../logic/notifications";
import type { RatingsHappyMoment, RatingsDataOfUser } from "../logic/ratings";

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
  isConnected: boolean | null;
  hasConnectedDevice: boolean;
  modalLock: boolean;
  backgroundEvents: Array<FwUpdateBackgroundEvent>;
};

// === BLE STATE ===

export type DeviceLike = {
  id: string;
  name: string;
  deviceInfo?: DeviceInfo;
  appsInstalled?: number;
  modelId?: DeviceModelId;
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

export type CurrencySettings = {
  confirmationsNb: number;
  // FIXME: SEEMS TO NEVER BE USED - DROPPING ?
  // exchange?: any | null;
};

export type Privacy = {
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

// export type SetExchangePairs = (_: Array<Pair>) => any;

export type Theme = "system" | "light" | "dark";

export type SettingsState = {
  counterValue: string;
  counterValueExchange: string | null | undefined;
  reportErrorsEnabled: boolean;
  analyticsEnabled: boolean;
  privacy: Privacy | null | undefined;
  currenciesSettings: Record<string, CurrencySettings>;
  pairExchanges: Record<string, string | null | undefined>;
  selectedTimeRange: PortfolioRange;
  orderAccounts: string;
  hasCompletedOnboarding: boolean;
  hasInstalledAnyApp: boolean;
  readOnlyModeEnabled: boolean;
  hasOrderedNano: boolean;
  experimentalUSBEnabled: boolean;
  countervalueFirst: boolean;
  graphCountervalueFirst: boolean;
  hideEmptyTokenAccounts: boolean;
  blacklistedTokenIds: string[];
  hiddenNftCollections: string[];
  dismissedBanners: string[];
  hasAvailableUpdate: boolean;
  theme: Theme;
  osTheme: string | null | undefined;
  carouselVisibility: number | Record<string, boolean>;
  // number is the legacy type from LLM V2
  discreetMode: boolean;
  language: string;
  languageIsSetByUser: boolean;
  locale: string | null | undefined;
  swap: {
    hasAcceptedIPSharing: false;
    acceptedProviders: string[];
    selectableCurrencies: string[];
    KYC: {
      [key: string]: KYCStatus;
    };
  };
  lastSeenDevice: DeviceModelInfo | null | undefined;
  starredMarketCoins: string[];
  lastConnectedDevice: Device | null | undefined;
  marketRequestParams: MarketListRequestParams;
  marketCounterCurrency: string | null | undefined;
  marketFilterByStarredAccounts: boolean;
  sensitiveAnalytics: boolean;
  firstConnectionHasDevice: boolean | null;
  notifications: {
    allowed: boolean;
    transactions: boolean;
    market: boolean;
    announcement: boolean;
    price: boolean;
  };
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

// === ROOT STATE ===

export type State = {
  accounts: AccountsState;
  settings: SettingsState;
  appstate: AppState;
  ble: BleState;
  ratings: RatingsState;
  notifications: NotificationsState;
  swap: SwapStateType;
  walletconnect: WalletConnectState;
  postOnboarding: PostOnboardingState;
};
