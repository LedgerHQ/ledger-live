import type { AddAddressFlowState } from "../../state/types";

export type AddAddressWebFlowStep = "currency" | "address" | "name" | "review" | "success";

type OpenAddAddressFlowState = Exclude<AddAddressFlowState, { status: "closed" }>;

export function resolveAddAddressWebFlowStep(
  state: OpenAddAddressFlowState,
): AddAddressWebFlowStep {
  switch (state.status) {
    case "selectingCurrency":
      return "currency";
    case "enteringAddress":
      return "address";
    case "namingAddress":
      return "name";
    case "confirmationRequired":
    case "reviewingAddress":
      return "review";
    case "success":
      return "success";
  }
}

export function shouldUseAddAddressFlowBackNavigation(state: OpenAddAddressFlowState): boolean {
  return (
    state.status === "enteringAddress" ||
    state.status === "namingAddress" ||
    state.status === "reviewingAddress" ||
    state.status === "confirmationRequired"
  );
}
