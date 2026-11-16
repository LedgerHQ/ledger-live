import type { StakePositionExitAction, StakePositionOrigin, StakePositionState } from "../types";

export type StakePositionTrackingContext = Readonly<{
  origin: StakePositionOrigin;
  ticker: string;
}>;

export type StakePositionTrackedPage = "details" | "confirm" | "notFound";

export type StakePositionTrackedStep =
  | Readonly<{ page: "details"; positionStatus: StakePositionState }>
  | Readonly<{ page: "confirm"; action: StakePositionExitAction }>
  | Readonly<{ page: "notFound" }>;

export type StakePositionTrackedButton =
  | "earn_more"
  | "deactivate"
  | "withdraw_all"
  | "confirm"
  | "back"
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
  notFound: "Not found",
} as const satisfies Record<StakePositionTrackedPage, string>;

const BUTTON_PAGES = {
  details: "Stake position details",
  confirm: "Stake position confirm",
  notFound: "Stake position not found",
} as const satisfies Record<StakePositionTrackedPage, string>;

// No address, amount or validator: only what identifies the flow and the currency.
const flowProps = ({ origin, ticker }: StakePositionTrackingContext) => ({
  flow: "stake",
  currency: ticker,
  source: origin,
});

function stepProps(step: StakePositionTrackedStep): EventProps {
  switch (step.page) {
    case "details":
      return { position_status: step.positionStatus };
    case "confirm":
      return { action: step.action };
    case "notFound":
      return {};
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
