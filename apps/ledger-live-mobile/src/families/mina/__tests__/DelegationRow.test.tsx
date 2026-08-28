import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import DelegationRow from "../Delegations/Row";
import { createDelegatingMinaAccount, mockValidators } from "./testUtils";
import type { Currency } from "@domain/entity-currency";

jest.mock("@ledgerhq/native-ui", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(Text, props, children),
  };
});

jest.mock("@react-navigation/native", () => ({
  useTheme: () => ({ colors: { card: "#fff", live: "#0f0" } }),
}));

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  formatCurrencyUnit: jest.fn(() => "10 MINA"),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => (key === "common.seeMore" ? "See more" : key) }),
}));

jest.mock("~/components/CounterValue", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return { __esModule: true, default: () => React.createElement(Text, null, "$100") };
});

jest.mock("~/icons/ArrowRight", () => {
  const { View } = require("react-native");
  return { __esModule: true, default: View };
});

jest.mock("../StakingFlow/ValidatorRow", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    ValidatorImage: ({ name }: { name: string }) =>
      React.createElement(Text, null, `image:${name}`),
  };
});

const currency = { id: "mina", ticker: "MINA" } as unknown as Currency;
const unit = { name: "MINA", code: "MINA", magnitude: 9 };

describe("Delegations/Row", () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  function renderRow(account = createDelegatingMinaAccount(mockValidators[0])) {
    return render(
      <DelegationRow account={account} currency={currency} unit={unit} onPress={onPress} />,
    );
  }

  it("displays the validator identity name and the formatted balance", () => {
    renderRow();

    expect(screen.getByText("Validator Alpha")).toBeOnTheScreen();
    expect(screen.getByText("10 MINA")).toBeOnTheScreen();
    expect(screen.getByText("See more")).toBeOnTheScreen();
  });

  it("falls back to the delegate address when the validator has no identity name", () => {
    const validator = { ...mockValidators[0], identityName: "" };
    renderRow(createDelegatingMinaAccount(validator));

    expect(screen.getByText(validator.address)).toBeOnTheScreen();
  });

  it("falls back to a dash when the delegate metadata is missing", () => {
    renderRow(createDelegatingMinaAccount(null));

    expect(screen.getByText("-")).toBeOnTheScreen();
  });

  it("calls onPress with the account when the row is pressed", async () => {
    const user = userEvent.setup();
    const account = createDelegatingMinaAccount(mockValidators[0]);
    renderRow(account);

    await user.press(screen.getByText("Validator Alpha"));

    expect(onPress).toHaveBeenCalledWith(account);
  });
});
