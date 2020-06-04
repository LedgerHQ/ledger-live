// @flow
import invariant from "invariant";
import type { DeviceAction } from "../../bot/types";
import type { Transaction } from "./types";
import { formatCurrencyUnit } from "../../currencies";

const acceptTransaction: DeviceAction<Transaction, {}> = ({
  transport,
  event,
  transaction,
  account,
  status,
  state = {
    screen: "",
    address: "",
    amount: "",
  },
}) => {
  const s = { ...state };

  if (event.text.startsWith("Accept")) {
    s.screen = "";
    transport.button("LRlr");
  } else if (event.text.startsWith("Amount")) {
    transport.button("Rr");
    s.screen = "amount";
    return s;
  } else if (event.text.startsWith("Fees")) {
    transport.button("Rr");
    s.screen = "fees";
    return s;
  } else if (event.text.startsWith("Address")) {
    transport.button("Rr");
    s.screen = "address";
    return s;
  } else if (
    event.text.startsWith("Review") ||
    event.text.startsWith("Confirm")
  ) {
    s.screen = "";
    transport.button("Rr");
  }

  if (s.screen === "fees") {
    let expectedText = formatCurrencyUnit(
      {
        ...account.unit,
        code: account.currency.deviceTicker || account.unit.code,
      },
      status.estimatedFees,
      {
        showCode: true,
        disableRounding: true,
      }
    ).replace(/\s/g, " ");
    let text = event.text;

    if (account.currency.id === "pivx" && text.startsWith("PIV ")) {
      expectedText = expectedText.replace("PIVX", "PIV");
      // FIXME on app side
      text = text.replace("PIVX", "PIV");
    }

    invariant(
      text === expectedText,
      "'%s' fees was expected. Got %s",
      expectedText,
      text
    );
  }

  if (s.screen === "address") {
    s.address += event.text;
    return s;
  } else if (s.address) {
    invariant(
      s.address === transaction.recipient,
      "'%s' recipient was expected. Got %s",
      transaction.recipient,
      s.address
    );
    s.address = "";
  }

  if (s.screen === "amount") {
    s.amount += event.text;
    return s;
  } else if (s.amount) {
    let expectedText = formatCurrencyUnit(
      {
        ...account.unit,
        code: account.currency.deviceTicker || account.unit.code,
      },
      status.amount,
      {
        showCode: true,
        disableRounding: true,
      }
    ).replace(/\s/g, " ");

    if (account.currency.id === "pivx" && s.amount.startsWith("PIV ")) {
      expectedText = expectedText.replace("PIVX", "PIV");
      // FIXME on app side
      s.amount = s.amount.replace("PIVX", "PIV");
    }

    invariant(
      s.amount.replace(" ", "") === expectedText.replace(" ", ""),
      "'%s' amount was expected. Got '%s'",
      expectedText,
      s.amount
    );
    s.amount = "";
  }

  return s;
};

export default { acceptTransaction };
