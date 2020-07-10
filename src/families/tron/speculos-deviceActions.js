// @flow
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";

const acceptTransaction: DeviceAction<Transaction, {}> = ({
  transport,
  event,
}) => {
  if (event.text.startsWith("Accept")) {
    transport.button("LRlr");
  } else if (
    event.text.startsWith("Review") ||
    event.text.startsWith("Resource") ||
    event.text.startsWith("Delegated") ||
    event.text.startsWith("From") ||
    event.text.startsWith("Gain") ||
    event.text.startsWith("Amount") ||
    event.text.startsWith("Freeze") ||
    event.text.startsWith("Token") ||
    event.text.startsWith("Send") ||
    event.text.startsWith("From") ||
    event.text.includes("...")
  ) {
    transport.button("Rr");
  }
};

export default { acceptTransaction };
