import React from "react";
import BigNumber from "bignumber.js";
import { fireEvent, screen, render } from "@tests/test-renderer";
import { shortAddressPreview } from "@ledgerhq/live-common/account/index";
import type { Currency, Unit } from "@ledgerhq/types-cryptoassets";
import type { Baker } from "@ledgerhq/live-common/families/tezos/types";
import DelegationRow from "../Row";

jest.mock("@ledgerhq/live-dmk-mobile", () => ({}), { virtual: true });

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useTheme: () => ({ colors: { lightGrey: "#eeeeee", live: "#00ff00" } }),
}));

jest.mock("../../BakerImage", () => () => null);
jest.mock("~/components/CounterValue", () => () => null);
jest.mock("~/components/CurrencyUnitValue", () => () => null);

const unit = { code: "XTZ", name: "tez", magnitude: 6 } as Unit;
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const currency = {
  id: "tezos",
  name: "Tezos",
  ticker: "XTZ",
  units: [unit],
} as unknown as Currency;

const baseProps = {
  address: "tz1aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  amount: new BigNumber(5),
  unit,
  currency,
  onPress: jest.fn(),
};

describe("DelegationRow", () => {
  it("shows the baker name when a baker is provided", () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    render(<DelegationRow {...baseProps} baker={{ name: "MyBaker" } as Baker} />);
    expect(screen.getByText("MyBaker")).toBeTruthy();
    expect(screen.getByText("common.seeMore")).toBeTruthy();
  });

  it("falls back to a short address when there is no baker", () => {
    render(<DelegationRow {...baseProps} baker={null} />);
    expect(screen.getByText(shortAddressPreview(baseProps.address))).toBeTruthy();
  });

  it("renders the status label when provided", () => {
    render(<DelegationRow {...baseProps} statusLabel="Unstaking" />);
    expect(screen.getByText("Unstaking")).toBeTruthy();
  });

  it("calls onPress when the row is pressed", () => {
    const onPress = jest.fn();
    render(<DelegationRow {...baseProps} onPress={onPress} />);
    fireEvent.press(screen.getByTestId("tezos-delegation-row"));
    expect(onPress).toHaveBeenCalled();
  });
});
