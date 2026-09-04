/**
 * Feature-flag controls surfaced by the tool.
 *
 * `payTabEnabled` drives the Pay tab flag (`lwdPayTab` / `lwmPayTab`) and
 * `cardParam` its `params.card` sub-flag; `ptxCardEnabled` drives the legacy
 * `ptxCard` flag.
 */
export interface PayCardFlagsProps {
  readonly payTabEnabled: boolean;
  readonly cardParam: boolean;
  readonly ptxCardEnabled: boolean;
  readonly setPayTabEnabled: (value: boolean) => void;
  readonly setCardParam: (value: boolean) => void;
  readonly setPtxCardEnabled: (value: boolean) => void;
}

/** A single Card onboarding step that can be marked done or not. */
export interface OnboardingStep {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
}

/**
 * Card onboarding controls.
 *
 * Exposes the onboarding steps so each one can be toggled done/not-done to
 * force the app into a given point of the onboarding flow.
 */
export interface PayCardOnboardingProps {
  readonly steps: readonly OnboardingStep[];
  readonly setStepDone: (id: string, done: boolean) => void;
}

/** One Card endpoint the tool can call on demand, with the last thing it returned. */
export interface PayCardProbe {
  readonly id: string;
  readonly label: string;
  readonly isFetching: boolean;
  /** The last response, pretty-printed. `undefined` until the probe has been run. */
  readonly result: string | undefined;
  readonly error: string | undefined;
  readonly run: () => void;
}

/**
 * Card interaction controls: call the signed-in cardholder's endpoints and read back what they
 * answer, so the data can be checked without a screen to render it.
 */
export interface PayCardInteractionProps {
  readonly probes: readonly PayCardProbe[];
}

/** One card-linked wallet, joined to its balance, exactly as the calculation saw it. */
export interface PayCardBalanceWallet {
  readonly id: string;
  readonly currency: string;
  readonly network: string;
  readonly address: string;
  /** Charging order. The wallets are listed in it. */
  readonly priority: number;
  /** `null` while the internal wallets are still being read, and when none matched this link. */
  readonly balance: string | null;
  /**
   * `null` whenever the balance is, and when the balance could not be priced. Those are left out
   * of the total.
   */
  readonly counterValue: number | null;
}

/** What one endpoint answered with, when it failed. */
export interface PayCardBalanceError {
  readonly endpoint: string;
  readonly detail: string;
}

/**
 * The card-linked wallets, as the balance calculation returns them.
 *
 * `total` is the raw sum the calculation produced, in the counter-value currency's smallest unit,
 * deliberately unformatted: the tool exists to show what the calculation returned.
 */
export interface PayCardBalanceProps {
  /**
   * Rendered verbatim, `undefined` included: the tool reports what the calculation returned.
   * `undefined` when not one wallet could be priced, which is not the same as a balance of zero.
   */
  readonly total: number | undefined;
  /** A wallet the rates could not price is left out of `total` rather than counted as zero. */
  readonly isPartialTotal: boolean;
  readonly wallets: readonly PayCardBalanceWallet[];
  readonly isFetching: boolean;
  readonly errors: readonly PayCardBalanceError[];
  /** Starts the wallet queries. The screen calls this when it opens. */
  readonly load: () => void;
  readonly refresh: () => void;
}

/**
 * One env var the tool shows, with the value a tester most often wants next.
 *
 * The app reads the two Card env vars on every request, so a value set here applies without a
 * restart. Nothing saves it: after a restart the app reads the build's value again.
 */
export interface PayCardEnvVar {
  readonly key: string;
  /** The value the app reads right now. */
  readonly value: string;
  /** What the input starts with, so one press is enough to change the tenant. */
  readonly suggestedValue: string;
}

/** The Card env vars the tool reads, and the one way it changes them. */
export interface PayCardEnvProps {
  readonly vars: readonly PayCardEnvVar[];
  readonly setVar: (key: string, value: string) => void;
}

/**
 * Props contract for the Card / Pay DevTool.
 *
 * Built by `@devtools/bindings` (`usePayCardToolProps`) from the host's Redux
 * state and actions. The component never reads app state directly.
 */
export interface PayCardToolProps {
  readonly flags: PayCardFlagsProps;
  readonly onboarding: PayCardOnboardingProps;
  readonly interaction: PayCardInteractionProps;
  readonly balance: PayCardBalanceProps;
  /** Whether the user has already seen the Pay feature tour. */
  readonly hasSeenFeatureTour: boolean;
  /** Resets the feature tour so it plays again on the next Pay visit. */
  readonly resetPayCardFeatureTourSeen: () => void;
  /** Whether the user has already dismissed the Request Verify hint. */
  readonly hasSeenReceiveVerifyHint: boolean;
  /** Resets the Request Verify hint so it shows again on the next Request. */
  readonly resetReceiveVerifyHintSeen: () => void;
  /** Host-only: jump to Portfolio. Omitted when the host cannot navigate. */
  readonly onNavigateToPortfolio?: () => void;
  /** Host-only: jump to the Pay tab. Omitted when the host cannot navigate. */
  readonly onNavigateToPayTab?: () => void;
  /** The Card backend env vars, read live and set from the tool. */
  readonly env: PayCardEnvProps;
}
