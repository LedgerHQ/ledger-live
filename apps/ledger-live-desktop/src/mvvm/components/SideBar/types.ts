import type { Location } from "react-router";
import type { SideBarActiveValue } from "./utils";

export interface ReferralProgramParams {
  readonly path?: string;
  readonly amount?: string;
  readonly isNew?: boolean;
}

export interface ReferralProgramConfig {
  readonly enabled?: boolean;
  readonly params?: ReferralProgramParams;
}

export interface RecoverFeatureParams {
  readonly openRecoverFromSidebar?: boolean;
  readonly protectId?: string;
}

export interface RecoverFeatureConfig {
  readonly enabled?: boolean;
  readonly params?: RecoverFeatureParams;
}

export interface SideBarViewModel {
  readonly pathname: string;
  readonly location: Location;
  readonly collapsed: boolean;
  readonly navigationLocked?: boolean;
  readonly noAccounts: boolean;
  readonly totalStarredAccounts: number;
  readonly displayBlueDot: boolean;
  readonly earnLabel: string;
  readonly isCardDisabled: boolean;
  readonly isLiveAppTabSelected: boolean;
  readonly isMarketBannerEnabled: boolean;
  readonly isQuickActionCtasEnabled: boolean;
  readonly isWallet40MainNavEnabled: boolean;
  readonly referralProgramConfig: ReferralProgramConfig | null;
  readonly recoverFeature: RecoverFeatureConfig | null;
  readonly recoverHomePath: string | undefined;
  readonly getMinHeightForStarredAccountsList: () => string;
  readonly handleCollapse: () => void;
  readonly handleCollapsedChange: (collapsed: boolean) => void;
  readonly push: (pathname: string) => void;
  readonly trackEntry: (entry: string, flagged?: boolean) => void;
  readonly handleClickDashboard: () => void;
  readonly handleClickMarket: () => void;
  readonly handleClickAccounts: () => void;
  readonly handleClickManager: () => void;
  readonly handleClickCatalog: () => void;
  readonly handleClickExchange: () => void;
  readonly handleClickEarn: () => void;
  readonly handleClickSwap: () => void;
  readonly handleClickPerps: () => void;
  readonly handleClickCard: () => void;
  readonly handleClickCardWallet: () => void;
  readonly handleClickRefer: () => void;
  readonly handleClickRecover: () => void;
  readonly handleOpenSendModal: () => void;
  readonly handleOpenReceiveModal: () => void;
  /** Current active sidebar value (for Wallet 4.0 SideBar). Empty string when no item matches. */
  readonly active: SideBarActiveValue;
  /** Handles sidebar item selection: navigates or invokes refer/recover. */
  readonly handleActiveChange: (value: string) => void;
}
