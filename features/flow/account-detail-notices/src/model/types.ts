export type CurrencyStatusSignal =
  | Readonly<{ type: "migration"; from: string; to: string; link?: string }>
  | Readonly<{ type: "willBeDeprecated"; date: string; link?: string }>;

export type AccountNoticeSignals = Readonly<{
  currencyId: string;
  currencyName: string;
  family: string;
  supportLink: string;
  status?: CurrencyStatusSignal;
  customBanner?: Readonly<{ text: string; link?: string }>;
  isRegionRestricted: boolean;
  regionRestrictedLink?: string;
  isRobinhoodDisclaimerEnabled: boolean;
  isPerpsEnabled: boolean;
}>;

export type LearnMoreAction = Readonly<{ type: "learnMore"; link: string }>;

export type OpenPerpsAction = Readonly<{ type: "openPerps" }>;

export type AccountNoticeAction = LearnMoreAction | OpenPerpsAction;

export type AccountNotice =
  | Readonly<{ id: "regionRestricted"; currencyName: string; action?: LearnMoreAction }>
  | Readonly<{ id: "migration"; from: string; to: string; action: LearnMoreAction }>
  | Readonly<{
      id: "willBeDeprecated";
      currencyName: string;
      date: string;
      action: LearnMoreAction;
    }>
  | Readonly<{ id: "custom"; text: string; action?: LearnMoreAction }>
  | Readonly<{ id: "robinhoodDisclaimer" }>
  | Readonly<{ id: "perps"; action: OpenPerpsAction }>;

export type AccountNoticeId = AccountNotice["id"];
