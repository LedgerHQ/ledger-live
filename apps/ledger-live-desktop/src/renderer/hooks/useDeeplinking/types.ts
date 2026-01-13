import { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { AppDispatch } from "~/renderer/store";

export type NavigateFn = (
  pathname: string,
  state?: { [k: string]: string | object },
  search?: string,
) => void;

export type OpenAddAccountFlowFn = (
  currency: CryptoOrTokenCurrency,
  skipFirstStep?: boolean,
  onAccountCreated?: (account: Account | TokenAccount, parentAccount?: Account) => void,
) => void;

export type OpenAssetFlowFn = () => void;

export type OpenSendFlowFn = (params?: {
  account?: Account | TokenAccount;
  parentAccount?: Account;
  recipient?: string;
  amount?: string;
}) => void;

export type PostOnboardingDeeplinkHandlerFn = (device?: string) => void;

export type TryRedirectToPostOnboardingOrRecoverFn = () => boolean;

export interface DeeplinkHandlerContext {
  dispatch: AppDispatch;
  accounts: Account[];
  navigate: NavigateFn;
  openAddAccountFlow: OpenAddAccountFlowFn;
  openAssetFlow: OpenAssetFlowFn;
  openSendFlow: OpenSendFlowFn;
  postOnboardingDeeplinkHandler: PostOnboardingDeeplinkHandlerFn;
  tryRedirectToPostOnboardingOrRecover: TryRedirectToPostOnboardingOrRecoverFn;
  currentPathname: string;
}

export interface ParsedDeeplink {
  url: string;
  path: string;
  query: Record<string, string>;
  search: string;
  tracking: DeeplinkTrackingData;
}

export interface DeeplinkTrackingData {
  ajsPropSource?: string;
  ajsPropCampaign?: string;
  ajsPropTrackData?: string;
  currency?: string;
  installApp?: string;
  appName?: string;
  deeplinkSource?: string;
  deeplinkType?: string;
  deeplinkDestination?: string;
  deeplinkChannel?: string;
  deeplinkMedium?: string;
  deeplinkCampaign?: string;
  deeplinkLocation?: string;
  url?: string;
}

export interface AccountsRoute {
  type: "accounts";
  address?: string;
}

export interface AccountRoute {
  type: "account";
  currency?: string;
  address?: string;
}

export interface AddAccountRoute {
  type: "add-account";
  currency?: string;
}

export interface BuyRoute {
  type: "buy";
  search: string;
}

export interface EarnRoute {
  type: "earn";
  path: string;
  cryptoAssetId?: string;
  accountId?: string;
  search: string;
}

export interface ManagerRoute {
  type: "myledger";
  installApp?: string;
}

export interface SwapRoute {
  type: "swap";
  amountFrom?: string;
  fromToken?: string;
  toToken?: string;
  affiliate?: string;
}

export interface BridgeRoute {
  type: "bridge";
  origin?: string;
  appName?: string;
}

export interface SendRoute {
  type: "send";
  currency?: string;
  recipient?: string;
  amount?: string;
}

export interface ReceiveRoute {
  type: "receive";
  currency?: string;
  recipient?: string;
  amount?: string;
}

export interface DelegateRoute {
  type: "delegate";
  currency?: string;
  recipient?: string;
  amount?: string;
}

export interface SettingsRoute {
  type: "settings";
  path: string;
}

export interface CardRoute {
  type: "card";
  query: Record<string, string>;
}

export interface DiscoverRoute {
  type: "discover";
  path: string;
  query: Record<string, string>;
  search: string;
}

export interface WalletConnectRoute {
  type: "wc";
  uri?: string;
  query: Record<string, string>;
}

export interface MarketRoute {
  type: "market";
  path: string;
}

export interface AssetRoute {
  type: "asset";
  path: string;
}

export interface RecoverRoute {
  type: "recover";
  path: string;
  search: string;
}

export interface RecoverRestoreFlowRoute {
  type: "recover-restore-flow";
}

export interface PostOnboardingRoute {
  type: "post-onboarding";
  device?: string;
}

export interface LedgerSyncRoute {
  type: "ledgersync";
}

export interface DefaultRoute {
  type: "default";
}

export type DeeplinkRoute =
  | AccountsRoute
  | AccountRoute
  | AddAccountRoute
  | BuyRoute
  | EarnRoute
  | ManagerRoute
  | SwapRoute
  | BridgeRoute
  | SendRoute
  | ReceiveRoute
  | DelegateRoute
  | SettingsRoute
  | CardRoute
  | DiscoverRoute
  | WalletConnectRoute
  | MarketRoute
  | AssetRoute
  | RecoverRoute
  | RecoverRestoreFlowRoute
  | PostOnboardingRoute
  | LedgerSyncRoute
  | DefaultRoute;

export type RouteByType<T extends DeeplinkRoute["type"]> = Extract<DeeplinkRoute, { type: T }>;

export type DeeplinkHandler<T extends DeeplinkRoute["type"]> = (
  route: RouteByType<T>,
  context: DeeplinkHandlerContext,
) => void | Promise<void>;

export type DeeplinkHandlerRegistry = {
  [K in DeeplinkRoute["type"]]?: DeeplinkHandler<K>;
};

export const SUPPORTED_DEEPLINK_TYPES: readonly DeeplinkRoute["type"][] = [
  "accounts",
  "account",
  "add-account",
  "buy",
  "earn",
  "myledger",
  "swap",
  "bridge",
  "send",
  "receive",
  "delegate",
  "settings",
  "card",
  "discover",
  "wc",
  "market",
  "asset",
  "recover",
  "recover-restore-flow",
  "post-onboarding",
  "ledgersync",
  "default",
] as const;
