import type { DeviceModelId } from "@ledgerhq/types-devices";

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
