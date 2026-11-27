import type { StakePositionExitAction } from "../types";

type ActionStep<Name extends string> = Readonly<{ name: Name; action: StakePositionExitAction }>;

export type StakePositionStep =
  | Readonly<{ name: "details" }>
  | ActionStep<"confirm">
  | ActionStep<"signing">
  | ActionStep<"broadcasting">
  | ActionStep<"success">
  | (ActionStep<"failure"> & Readonly<{ error: Error; signed: boolean }>);

export type StakePositionStepEvent =
  | Readonly<{ type: "selectExit"; action: StakePositionExitAction }>
  | Readonly<{ type: "back" }>
  | Readonly<{ type: "confirm" }>
  | Readonly<{ type: "signed" }>
  | Readonly<{ type: "broadcasted" }>
  | Readonly<{ type: "failed"; error: Error }>
  | Readonly<{ type: "retry" }>;

export const INITIAL_STAKE_POSITION_STEP: StakePositionStep = { name: "details" };

function fromConfirm(
  step: ActionStep<"confirm">,
  event: StakePositionStepEvent,
): StakePositionStep {
  if (event.type === "back") return INITIAL_STAKE_POSITION_STEP;
  if (event.type === "confirm") return { name: "signing", action: step.action };
  return step;
}

function fromSigning(
  step: ActionStep<"signing">,
  event: StakePositionStepEvent,
): StakePositionStep {
  if (event.type === "signed") return { name: "broadcasting", action: step.action };
  if (event.type === "failed") {
    return { name: "failure", action: step.action, error: event.error, signed: false };
  }
  return step;
}

function fromBroadcasting(
  step: ActionStep<"broadcasting">,
  event: StakePositionStepEvent,
): StakePositionStep {
  if (event.type === "broadcasted") return { name: "success", action: step.action };
  if (event.type === "failed") {
    return { name: "failure", action: step.action, error: event.error, signed: true };
  }
  return step;
}

/** The steps of one surface. An event the current step does not expect leaves it unchanged. */
export function stakePositionStepReducer(
  step: StakePositionStep,
  event: StakePositionStepEvent,
): StakePositionStep {
  switch (step.name) {
    case "details":
      return event.type === "selectExit" ? { name: "confirm", action: event.action } : step;
    case "confirm":
      return fromConfirm(step, event);
    case "signing":
      return fromSigning(step, event);
    case "broadcasting":
      return fromBroadcasting(step, event);
    case "failure":
      return event.type === "retry" ? { name: "confirm", action: step.action } : step;
    case "success":
      return step;
  }
}
