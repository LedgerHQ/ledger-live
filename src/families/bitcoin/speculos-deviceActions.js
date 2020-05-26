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
    event.text.startsWith("Amount") ||
    event.text.startsWith("Address") ||
    event.text.startsWith("Confirm") ||
    event.text.startsWith("Fees")
  ) {
    transport.button("Rr");
  }
};

export default { acceptTransaction };
