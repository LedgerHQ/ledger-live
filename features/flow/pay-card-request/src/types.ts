export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type VerifyAddressPhase = "hidden" | "intro" | "success";

/** Single digit index of a "Next steps" entry, matching the design-system numbered Spot. */
export type VerifyAddressNextStepIndex = 1 | 2;

export type VerifyAddressNextStep = Readonly<{
  index: VerifyAddressNextStepIndex;
  label: string;
}>;

/**
 * User-facing copy injected by the host app. This package stays i18n-agnostic: the app
 * resolves translations and passes the strings in.
 */
export type VerifyAddressLabels = Readonly<{
  introTitle: string;
  introDescription: string;
  verifyCta: string;
  successTitle: string;
  nextStepsLabel: string;
  nextStepShare: string;
  nextStepMatch: string;
  gotItCta: string;
}>;

export type VerifyAddressProps = Readonly<{
  phase: VerifyAddressPhase;
  labels: VerifyAddressLabels;
  page: string;
  /** Host starts the device intent (DIE lives in the app, not in this package). */
  onVerify: () => void;
  /** Host closes the success overlay. */
  onGotIt: () => void;
  onClose: () => void;
  onTrackEvent?: PayCardTrackEvent;
}>;

export type VerifyAddressViewModel = Readonly<{
  isIntroOpen: boolean;
  isSuccessOpen: boolean;
  nextSteps: readonly VerifyAddressNextStep[];
  onVerify: () => void;
  onGotIt: () => void;
  onClose: () => void;
}>;

export type VerifyAddressIntroViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  verifyCta: string;
  onVerify: () => void;
  onClose: () => void;
}>;

export type VerifyAddressSuccessViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  nextStepsLabel: string;
  nextSteps: readonly VerifyAddressNextStep[];
  gotItCta: string;
  onGotIt: () => void;
  onClose: () => void;
}>;
