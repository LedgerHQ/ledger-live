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
  onTrackEvent?: PayRequestTrackEvent;
  /** Native only: Android 3-button nav / iOS home indicator. */
  bottomInset?: number;
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
 * User-facing copy injected by the host app. Copy stays i18n-agnostic; `copied` is the transient
 * label shown right after the address is copied.
 */
export type RequestReceiveActionLabels = Readonly<{
  share: string;
  copy: string;
  copied: string;
  save: string;
  verify: string;
}>;

export type RequestReceiveLabels = Readonly<{
  title: string;
  networkLabel: string;
  actions: RequestReceiveActionLabels;
}>;

export type RequestReceiveVerifyHint = Readonly<{
  open: boolean;
  message: string;
  gotItLabel: string;
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
  labels: RequestReceiveLabels;
  assetIcon: RequestReceiveIconProps;
  networkIcon?: RequestReceiveIconProps;
  /** Actions rendered, in order. Desktop uses `["save", "copy", "verify"]`. */
  visibleActions: readonly RequestReceiveActionId[];
  /**
   * Native only: attached to the shareable card so the host can capture it as an image. Left
   * opaque here because the web build must not depend on `react-native` types.
   */
  cardRef?: RefObject<unknown>;
  onClose: () => void;
  verifyHint?: RequestReceiveVerifyHint;
}>;

export type RequestReceiveProps = RequestReceiveViewModelParams & RequestReceiveShell;

export type RequestReceiveViewProps = RequestReceiveShell &
  Pick<
    RequestReceiveViewModel,
    "address" | "addressParts" | "qrPayload" | "onShare" | "onCopy" | "onSave" | "onVerify"
  >;
