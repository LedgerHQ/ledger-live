import type { DeviceId } from "@ledgerhq/client-ids/ids";
import type { DeviceExtractedContext } from "@ledgerhq/device-intent";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import type { Account, DeviceInfo, FirmwareUpdateContext } from "@ledgerhq/types-live";
import type { FlowName } from "../../device-action/utils";
import type { RequiresDerivation } from "../connectApp";

export type ExpectedAccountIdentity = {
  accountName: string;
  acceptableDerivedAddresses: string[];
};

/**
 * Caller-provided context used to decide whether a deprecation screen applies
 * for the current connect-app flow.
 */
export type DeprecationPresentationInput = {
  /** Flow in which connect-app is currently running. */
  flow: FlowName;
  /**
   * User-facing main currency or token name.
   *
   * This value is used for policy exception matching, persisted warning
   * dismissal matching, and deprecation screen copy.
   */
  currencyName: string;
};

/** Ordered, non-blocking deprecation screens that the UI may need to display. */
export type DeprecationScreenKind = "warning" | "clearSigning";

/** No deprecation UI should be shown and initialization can continue immediately. */
export type SkippedDeprecationPresentationDecision = {
  status: "skipped";
};

/**
 * Non-blocking deprecation UI must be shown before initialization can continue.
 */
export type ShownDeprecationPresentationDecision = {
  status: "show";
  /**
   * Ordered list of non-blocking screens to show to the user.
   *
   * The UI should preserve this order when walking through the sequence.
   */
  screenSequence: DeprecationScreenKind[];
  /** User-facing currency or token name the decision applies to. */
  currencyName: string;
  /** Device model affected by the deprecation policy. */
  deviceModelId: DeviceModelId;
  /**
   * Date shown in deprecation copy for when support for this currency on this
   * device model ends.
   */
  supportEndDate: Date;
};

/**
 * The flow is blocked by deprecation policy and must not continue.
 */
export type BlockingDeprecationPresentationDecision = {
  status: "block";
  /** User-facing currency or token name the decision applies to. */
  currencyName: string;
  /** Device model affected by the deprecation policy. */
  deviceModelId: DeviceModelId;
  /**
   * Date shown in deprecation copy for when support for this currency on this
   * device model ends.
   */
  supportEndDate: Date;
};

/**
 * UI-ready result of evaluating device deprecation for a specific flow and
 * currency.
 *
 * This folds together remote-config applicability, flow/currency matching, and
 * warning dismissal state so rendering code does not need to recompute them.
 */
export type DeprecationPresentationDecision =
  | SkippedDeprecationPresentationDecision
  | ShownDeprecationPresentationDecision
  | BlockingDeprecationPresentationDecision;

export type AppRequestInput = {
  appName?: string;
  currency?: CryptoCurrency | null;
  account?: Account;
  tokenCurrency?: TokenCurrency;
  dependencies?: AppRequestInput[];
  withInlineInstallProgress?: boolean;
  requireLatestFirmware?: boolean;
  allowPartialDependencies?: boolean;
};

export type ConnectAppInitializationInput = {
  appName: string;
  dependencies: string[];
  requireLatestFirmware: boolean;
  allowPartialDependencies: boolean;
  requiresDerivation?: RequiresDerivation;
  expectedAccount?: ExpectedAccountIdentity;
  deprecation?: DeprecationPresentationInput;
};

export type ConnectAppInitSideEffects = {
  onDeviceIdObserved: (deviceId: DeviceId) => void;
  onLastSeenDeviceInfoObserved: (params: {
    modelId: DeviceModelId;
    deviceInfo: DeviceInfo;
    latestFirmware: FirmwareUpdateContext | null;
  }) => void;
};

export type ConnectAppInitJobState =
  | { type: "connect-device" }
  | { type: "unlock-device" }
  | { type: "locked-device" }
  | { type: "request-manager-permission" }
  | { type: "listing-apps" }
  | {
      type: "installing-app";
      appName: string;
      progress: number;
      index: number;
      total: number;
    }
  | {
      type: "requires-app-installation";
      appName: string;
      appNames: string[];
    }
  | { type: "request-quit-app" }
  | { type: "request-open-app"; appName: string }
  | {
      type: "deprecation-show";
      decision: Extract<DeprecationPresentationDecision, { status: "show" }>;
      onContinue: () => void;
    }
  | {
      type: "deprecation-block";
      decision: Extract<DeprecationPresentationDecision, { status: "block" }>;
    }
  | {
      type: "wrong-device";
      accountName: string;
    }
  | {
      type: "outdated-app-warning";
      appName: string;
      onContinue: () => void;
    }
  | { type: "loading" }
  | { type: "error"; error: unknown }
  | { type: "done"; extractedContext: DeviceExtractedContext };
