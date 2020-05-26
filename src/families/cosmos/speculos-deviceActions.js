// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";

const acceptTransaction: DeviceAction<
  Transaction,
  { lastStepReached: boolean }
> = ({
  transport,
  event,
  state = {
    lastStepReached: false,
  },
}) => {
  if (
    event.text.startsWith("Chain ID") ||
    event.text.startsWith("Account") ||
    event.text.startsWith("Sequence") ||
    event.text.startsWith("Fee") ||
    event.text.startsWith("Gas") ||
    event.text.startsWith("Type") ||
    event.text.startsWith("Amount") ||
    event.text.startsWith("From") ||
    event.text.startsWith("To") ||
    event.text.startsWith("Memo") ||
    event.text.startsWith("Delegator") ||
    event.text.startsWith("Validator")
  ) {
    transport.button("Rr");
    return state;
  }

  if (!state.lastStepReached && event.text.startsWith("Sign transaction")) {
    transport.button("RrLRlr");
    return { lastStepReached: true };
  }

  return state;
};

export default { acceptTransaction };
