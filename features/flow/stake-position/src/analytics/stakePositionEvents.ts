import type { StakePositionExitAction, StakePositionOrigin, StakePositionState } from "../types";

export type StakePositionTrackingContext = Readonly<{
  origin: StakePositionOrigin;
  ticker: string;
}>;

export type StakePositionTrackedPage =
  | "details"
  | "confirm"
  | "success"
  | "failure"
  | "unavailable";

export type StakePositionTrackedStep =
  | Readonly<{ page: "details"; positionStatus: StakePositionState }>
  | Readonly<{ page: "confirm" | "success" | "failure"; action: StakePositionExitAction }>
  | Readonly<{ page: "unavailable"; reason: "not_found" | "load_error" }>;

export type StakePositionTrackedButton =
  | "earn_more"
  | "deactivate"
  | "withdraw"
  | "confirm"
  | "view_transaction"
  | "try_again"
  | "retry_load"
  | "close";

type EventProps = Readonly<Record<string, string>>;

export type StakePositionPageEvent = Readonly<{
  category: string;
  name: string;
  props: EventProps;
}>;

export type StakePositionButtonEvent = Readonly<{ event: "button_clicked"; props: EventProps }>;

const PAGE_NAMES = {
  details: "Details",
  confirm: "Confirm",
  success: "Success",
  failure: "Failure",
  unavailable: "Unavailable",
} as const satisfies Record<StakePositionTrackedPage, string>;

const BUTTON_PAGES = {
  details: "Stake position details",
  confirm: "Stake position confirm",
  success: "Stake position success",
  failure: "Stake position failure",
  unavailable: "Stake position unavailable",
} as const satisfies Record<StakePositionTrackedPage, string>;

// No address, amount or validator: only what identifies the flow, its entry and the currency.
const flowProps = ({ origin, ticker }: StakePositionTrackingContext) => ({
  flow: "stake",
  currency: ticker,
  source: origin,
});

function stepProps(step: StakePositionTrackedStep): EventProps {
  switch (step.page) {
    case "details":
      return { position_status: step.positionStatus };
    case "unavailable":
      return { reason: step.reason };
    default:
      return { action: step.action };
  }
}

export function buildStakePositionPageEvent(
  context: StakePositionTrackingContext,
  step: StakePositionTrackedStep,
): StakePositionPageEvent {
  return {
    category: "Stake position",
    name: PAGE_NAMES[step.page],
    props: { ...flowProps(context), ...stepProps(step) },
  };
}

export function buildStakePositionButtonEvent(
  context: StakePositionTrackingContext,
  button: StakePositionTrackedButton,
  page: StakePositionTrackedPage,
  action?: StakePositionExitAction,
): StakePositionButtonEvent {
  return {
    event: "button_clicked",
    props: {
      button,
      page: BUTTON_PAGES[page],
      ...flowProps(context),
      ...(action === undefined ? {} : { action }),
    },
  };
}
