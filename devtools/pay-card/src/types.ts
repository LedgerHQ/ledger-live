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
  /** Whether the user has already seen the Pay feature tour. */
  readonly hasSeenFeatureTour: boolean;
  /** Resets the feature tour so it plays again on the next Pay visit. */
  readonly resetPayCardFeatureTourSeen: () => void;
  /** Whether the user has already dismissed the Request Verify hint. */
  readonly hasSeenReceiveVerifyHint: boolean;
  /** Resets the Request Verify hint so it shows again on the next Request. */
  readonly resetReceiveVerifyHintSeen: () => void;
  /** Whether the card holder has already seen the Card login intro sheet. */
  readonly hasSeenLoginIntro: boolean;
  /** Resets the login intro so it shows again on the next Card `Login` press. */
  readonly resetPayCardLoginIntroSeen: () => void;
  /** Host-only: jump to Portfolio. Omitted when the host cannot navigate. */
  readonly onNavigateToPortfolio?: () => void;
  /** Host-only: jump to the Pay tab. Omitted when the host cannot navigate. */
  readonly onNavigateToPayTab?: () => void;
  /** The Card backend env vars, read live and set from the tool. */
  readonly env: PayCardEnvProps;
}
