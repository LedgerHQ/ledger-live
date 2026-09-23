import type { RefObject } from "react";
import type { AddressParts } from "./utils/splitAddress";

export type PayRequestTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type VerifyAddressPhase = "hidden" | "intro" | "success";

/** Single digit index of a "Next steps" entry, matching the design-system numbered Spot. */
export type VerifyAddressNextStepIndex = 1 | 2;

export type VerifyAddressNextStep = Readonly<{
  index: VerifyAddressNextStepIndex;
  label: string;
}>;

/**
 * Copy is resolved inside this package through `@shared/i18n`; the host only injects phase,
 * analytics, and device-intent callbacks. Keys live under `payTab.request.verifyAddress.*`
 * in each app's default namespace.
 */
export type VerifyAddressProps = Readonly<{
  phase: VerifyAddressPhase;
  page: string;
  /** Host starts the device intent (DIE lives in the app, not in this package). */
  onVerify: () => void;
  /** Host closes the success overlay. */
  onGotIt: () => void;
  onClose: () => void;
  onTrackEvent?: PayRequestTrackEvent;
  /** Native only: Android 3-button nav / iOS home indicator. */
  bottomInset?: number;
}>;

export type VerifyAddressViewModel = Readonly<{
  isIntroOpen: boolean;
  isSuccessOpen: boolean;
  introTitle: string;
  introDescription: string;
  verifyCta: string;
  successTitle: string;
  nextStepsLabel: string;
  nextSteps: readonly VerifyAddressNextStep[];
  gotItCta: string;
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
  bottomInset?: number;
}>;

export type VerifyAddressSuccessViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  nextStepsLabel: string;
  nextSteps: readonly VerifyAddressNextStep[];
  gotItCta: string;
  onGotIt: () => void;
  onClose: () => void;
  bottomInset?: number;
}>;

/**
 * Display data for the requested asset.
 */
export type RequestReceiveAsset = Readonly<{
  name: string;
  ticker: string;
}>;

export type RequestActionCallbacks = Readonly<{
  /** Optional: mobile-only tile. Desktop does not surface Share. */
  onShare?: (address: string) => void;
  onCopy: (address: string) => void;
  /** Optional: desktop-only tile. Mobile does not surface Save. */
  onSave?: (address: string) => void;
  onVerify: (address: string) => void;
}>;

export type RequestReceiveViewModelParams = RequestActionCallbacks &
  Readonly<{
    address: string;
    asset: RequestReceiveAsset;
    network: string;
    page: string;
    onTrackEvent?: PayRequestTrackEvent;
  }>;

export type RequestReceiveViewModel = Readonly<{
  title: string;
  networkLabel: string;
  asset: RequestReceiveAsset;
  network: string;
  address: string;
  addressParts: AddressParts;
  qrPayload: string;
  onShare: () => void;
  onCopy: () => void;
  onSave: () => void;
  onVerify: () => void;
}>;

export type RequestReceiveActionId = "share" | "copy" | "save" | "verify";

/**
 * Host-owned verify-hint state. Copy is resolved in this package under
 * `payTab.request.verifyHint.*`.
 */
export type RequestReceiveVerifyHint = Readonly<{
  open: boolean;
  onGotIt: () => void;
  onShown?: () => void;
}>;

/** Props for the branded `CryptoIcon` shown for the asset and (optionally) the network row. */
export type RequestReceiveIconProps = Readonly<{
  ledgerId: string;
  ticker: string;
  network?: string;
}>;

/** Presentation inputs shared by the container props and the view props. */
type RequestReceiveShell = Readonly<{
  isOpen: boolean;
  assetIcon: RequestReceiveIconProps;
  networkIcon?: RequestReceiveIconProps;
  /** Actions rendered, in order. Desktop uses `["save", "copy", "verify"]`. */
  visibleActions: readonly RequestReceiveActionId[];
  cardRef?: RefObject<unknown>;
  onClose: () => void;
  verifyHint?: RequestReceiveVerifyHint;
}>;

export type RequestReceiveProps = RequestReceiveViewModelParams & RequestReceiveShell;

export type RequestReceiveViewProps = RequestReceiveShell &
  Pick<
    RequestReceiveViewModel,
    | "title"
    | "networkLabel"
    | "address"
    | "addressParts"
    | "qrPayload"
    | "onShare"
    | "onCopy"
    | "onSave"
    | "onVerify"
  >;
