export interface PayCardFlagsProps {
  readonly payTabEnabled: boolean;
  readonly cardParam: boolean;
  readonly ptxCardEnabled: boolean;
  readonly setPayTabEnabled: (value: boolean) => void;
  readonly setCardParam: (value: boolean) => void;
  readonly setPtxCardEnabled: (value: boolean) => void;
}

export interface OnboardingStep {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
}

export interface PayCardOnboardingProps {
  readonly steps: readonly OnboardingStep[];
  readonly setStepDone: (id: string, done: boolean) => void;
}

export interface PayCardSessionSnapshot {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface PayCardMockResponse {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
}

export interface PayCardRenewalMockProps {
  readonly available: boolean;
  readonly response: string;
  readonly responses: readonly PayCardMockResponse[];
  readonly setResponse: (id: string) => void;
  readonly renewals: number;
  readonly resetRenewals: () => void;
  readonly armUnauthorized: () => void;
}

export interface PayCardMockSessionProps {
  readonly available: boolean;
  readonly signIn: () => void;
}

export interface PayCardActionResult {
  readonly id: number;
  readonly message: string;
  readonly failed: boolean;
}

export interface PayCardAuthProps {
  readonly session: PayCardSessionSnapshot | null;
  readonly sessionError: string | null;
  readonly busy: boolean;
  readonly lastResult: PayCardActionResult | null;
  readonly readTokens: () => void;
  readonly renewNow: () => void;
  readonly breakAccessToken: () => void;
  readonly breakRefreshToken: () => void;
  readonly clearSession: () => void;
  readonly signOut: () => void;
  readonly fetchUser: () => void;
  readonly openPayTab?: () => void;
  readonly mock: PayCardRenewalMockProps;
  readonly mockSession: PayCardMockSessionProps;
}

export interface PayCardProbe {
  readonly id: string;
  readonly label: string;
  readonly isFetching: boolean;
  readonly result: string | undefined;
  readonly error: string | undefined;
  readonly run: () => void;
}

/** The four colours the provider paints the details image with. Hex, `#RGB` or `#RRGGBB`. */
export interface PayCardDetailsCssProps {
  readonly cardBackgroundColor?: string;
  readonly cardTextColor?: string;
  /** PAN is the card number: the provider draws it on its own strip. */
  readonly panBackgroundColor?: string;
  readonly panTextColor?: string;
}

/**
 * The secure card details image.
 *
 * The provider renders PAN, CVV and expiry itself and hands back a URL whose token is the whole
 * credential, so the image loads with no headers. The URL is single-use and short-lived: it is
 * never rendered as text, never logged, and dropped when the screen is left.
 */
export interface PayCardDetailsImageProps {
  readonly imageUrl: string | undefined;
  readonly isFetching: boolean;
  readonly error: string | undefined;
  readonly request: (customCss?: PayCardDetailsCssProps) => void;
  /** Drops the minted URL, so coming back to the screen mints a fresh one. */
  readonly clear: () => void;
}

export interface PayCardInteractionProps {
  readonly probes: readonly PayCardProbe[];
  readonly details: PayCardDetailsImageProps;
}

export interface PayCardBaanxWallet {
  readonly id: string;
  readonly balance: string;
  readonly currency: string;
  readonly address: string;
  /** Absent when the provider sent no key at all, `null` when it sent one: the tool shows which. */
  readonly addressMemo?: string | null;
}

export interface PayCardLinkedWallet {
  readonly id: string;
  readonly address: string;
  readonly currency: string;
  readonly network: string;
  /** Charging order. The wallets are listed in it. */
  readonly priority: number;
  /** The Ledger currency the pair above resolves to, absent when the catalog does not cover it. */
  readonly ledgerId?: string;
}

export interface PayCardCombinedWallet {
  readonly id: string;
  readonly address: string;
  readonly currency: string;
  readonly network: string;
  readonly priority: number;
  readonly ledgerId?: string;
  /** `null` when no Baanx wallet matched this link, and while they are still being read. */
  readonly balance: string | null;
}

/** One row of the Card asset catalog: what the provider calls an asset, and what Ledger calls it. */
export interface PayCardCurrencyMappingRow {
  /** The `{currency}.{network}` id the catalog is keyed on. */
  readonly key: string;
  readonly ledgerId: string;
}

export interface PayCardBalanceError {
  readonly endpoint: string;
  readonly detail: string;
}

export interface PayCardBalanceProps {
  readonly baanxWallets: readonly PayCardBaanxWallet[];
  readonly linkedWallets: readonly PayCardLinkedWallet[];
  readonly combinedWallets: readonly PayCardCombinedWallet[];
  readonly isFetching: boolean;
  readonly errors: readonly PayCardBalanceError[];
  readonly load: () => void;
  readonly refresh: () => void;
}

export type PayCardOpenSecureBrowser = (url: string) => Promise<string>;

export interface PayCardOnboardingStatusStep {
  readonly id: string;
  readonly isDone: boolean;
  /**
   * Whether something can drive this step. False while no source answers it, which is the purchase
   * step until the transactions endpoint is read.
   */
  readonly canToggle: boolean;
}

export interface PayCardOnboardingStatusProps {
  readonly steps: readonly PayCardOnboardingStatusStep[];
  readonly completedCount: number;
  readonly isFetching: boolean;
  readonly error: string | undefined;
  readonly raw: string;
  readonly refresh: () => void;
  readonly setStepDone: (id: string, done: boolean) => void;
  readonly clearMocks: () => void;
  readonly isMockingEnabled: boolean;
}

export interface PayCardToolProps {
  readonly flags: PayCardFlagsProps;
  readonly onboarding: PayCardOnboardingProps;
  readonly cardOnboarding: PayCardOnboardingStatusProps;
  readonly interaction: PayCardInteractionProps;
  readonly balance: PayCardBalanceProps;
  /** The whole Card asset catalog, so a mapping gap can be read against it. */
  readonly currencyMapping: readonly PayCardCurrencyMappingRow[];
  /** Whether the user has already seen the Pay feature tour. */
  readonly hasSeenFeatureTour: boolean;
  /** Resets the feature tour so it plays again on the next Pay visit. */
  readonly resetPayCardFeatureTourSeen: () => void;
  /** Whether the user has already dismissed the Request Verify hint. */
  readonly hasSeenReceiveVerifyHint: boolean;
  /** Resets the Request Verify hint so it shows again on the next Request. */
  readonly resetReceiveVerifyHintSeen: () => void;
  readonly hasSeenLoginIntro: boolean;
  readonly resetPayCardLoginIntroSeen: () => void;
  /** Whether the card onboarding widget has been permanently dismissed (all steps done + Got it). */
  readonly hasCompletedCardOnboarding: boolean;
  /** Resets the onboarding completion flag so the widget reappears. */
  readonly resetCardOnboarding: () => void;
  /** Host-only: jump to Portfolio. Omitted when the host cannot navigate. */
  readonly onNavigateToPortfolio?: () => void;
  /** Host-only: jump to the Pay tab. Omitted when the host cannot navigate. */
  readonly onNavigateToPayTab?: () => void;
  /** Host-only: jump to the Pay contact success screen. Omitted when the host cannot navigate. */
  readonly onNavigateToPaySuccess?: () => void;
  /** Host-only: jump to the generic Send success screen. Omitted when the host cannot navigate. */
  readonly onNavigateToSendSuccess?: () => void;
  readonly auth?: PayCardAuthProps;
  readonly openSecureBrowser?: PayCardOpenSecureBrowser;
}
