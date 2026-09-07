import type { AddAddressDisplayContext, AddAddressFlowState } from "./state/types";

export type PrefillAddAddressFlowVisibleState = Extract<
  AddAddressFlowState,
  { status: "namingAddress" | "reviewingAddress" }
> &
  Readonly<{
    entryMode: "prefilled";
    displayContext: AddAddressDisplayContext;
  }>;

export function isPrefillAddAddressFlowOpen(
  state: AddAddressFlowState,
): state is PrefillAddAddressFlowVisibleState {
  return (
    (state.status === "namingAddress" || state.status === "reviewingAddress") &&
    state.entryMode === "prefilled" &&
    state.displayContext !== null
  );
}
