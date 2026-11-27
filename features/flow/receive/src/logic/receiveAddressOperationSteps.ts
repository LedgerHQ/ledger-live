import type { AccountDataError } from "@domain/entity-account-data";
import { toErrorAttributes, type OperationAttributes } from "@shared/observability-operations";
import type { ReceiveOperationEnding } from "./receiveOperations";
import type { ReceiveAddressOptionId } from "./toReceiveAddressOptions";
import type { ReceiveScreenState } from "./toReceiveScreenState";

export type ReceiveAddressScreen = Readonly<{
  type: ReceiveScreenState["type"];
  isSelecting: boolean;
  pickedOptionId: ReceiveAddressOptionId | undefined;
  sanctionStatus: "checking" | "clear" | "sanctioned";
  hasServiceIncident: boolean;
  failedKinds: string | undefined;
  readError: AccountDataError | undefined;
}>;

export type ReceiveAddressAttempt = Readonly<{ wasGated: boolean; gateActionOpened: boolean }>;

export type ReceiveAddressLeaveTrigger = "close" | "unmount";

export type ReceiveAddressProgress = Readonly<{
  annotations: OperationAttributes;
  wasGated: boolean;
  ending: ReceiveOperationEnding | undefined;
}>;

const GATE_OUTCOME: Partial<Record<ReceiveScreenState["type"], string>> = {
  onboardingRequired: "onboarding_required",
  activationRequired: "activation_required",
};

const ACCOUNT_NOT_FOUND = "AccountNotFound";

const toReadFailureAttributes = ({
  failedKinds,
  readError,
}: ReceiveAddressScreen): OperationAttributes => ({
  failed_kinds: failedKinds,
  ...(readError ? toErrorAttributes(readError) : { error_name: ACCOUNT_NOT_FOUND }),
});

const toPendingStep = ({ isSelecting, pickedOptionId, sanctionStatus }: ReceiveAddressScreen) => {
  if (isSelecting) return "selecting";
  return pickedOptionId && sanctionStatus === "checking" ? "checking_sanction" : "loading";
};

const toShownAddressEnding = (
  { pickedOptionId, sanctionStatus, hasServiceIncident }: ReceiveAddressScreen,
  wasGated: boolean,
): ReceiveOperationEnding | undefined => {
  if (!pickedOptionId || sanctionStatus === "checking") return undefined;
  if (sanctionStatus === "sanctioned") {
    return { type: "succeed", attributes: { outcome: "sanctioned" } };
  }
  return {
    type: "succeed",
    attributes: {
      address_option: pickedOptionId,
      service_incident: hasServiceIncident,
      gate_resolved: wasGated || undefined,
    },
  };
};

export function toReceiveAddressProgress(
  screen: ReceiveAddressScreen,
  attempt: ReceiveAddressAttempt,
): ReceiveAddressProgress {
  const wasGated = attempt.wasGated || GATE_OUTCOME[screen.type] !== undefined;
  return {
    annotations: screen.isSelecting ? { step: "selecting", has_address_choice: true } : {},
    wasGated,
    ending: toShownAddressEnding(screen, wasGated),
  };
}

export function toReceiveAddressLeaveEnding(
  screen: ReceiveAddressScreen,
  trigger: ReceiveAddressLeaveTrigger,
  attempt: ReceiveAddressAttempt,
): ReceiveOperationEnding {
  if (screen.type === "error") {
    return {
      type: "fail",
      reason: "ERROR",
      attributes: { trigger, ...toReadFailureAttributes(screen) },
    };
  }
  const gateOutcome = GATE_OUTCOME[screen.type];
  if (gateOutcome) {
    return {
      type: "succeed",
      attributes: { outcome: gateOutcome, gate_action_opened: attempt.gateActionOpened },
    };
  }
  return {
    type: "fail",
    reason: "ABANDONED",
    attributes: { trigger, step: toPendingStep(screen) },
  };
}

export function toReceiveAddressRetryEnding(screen: ReceiveAddressScreen): ReceiveOperationEnding {
  return {
    type: "fail",
    reason: "ERROR",
    attributes: { trigger: "retry", ...toReadFailureAttributes(screen) },
  };
}
