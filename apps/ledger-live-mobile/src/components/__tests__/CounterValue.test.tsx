import React from "react";
import { Text } from "react-native";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { useCalculate } from "@ledgerhq/live-countervalues-react";
import { render, screen } from "@tests/test-renderer";
import CounterValue from "../CounterValue";

jest.mock("@ledgerhq/live-countervalues-react", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues-react"),
  useCalculate: jest.fn(),
  useCountervaluesPolling: () => ({ poll: jest.fn() }),
}));

jest.mock("~/actions/general", () => ({
  useTrackingPairs: () => [],
  addExtraSessionTrackingPair: jest.fn(),
}));

jest.mock("../CurrencyUnitValue", () => ({ value }: { value: number }) => (
  <Text testID="countervalue-value">{String(value)}</Text>
));

describe("CounterValue", () => {
  it("renders a real zero even when no rate is available", () => {
    jest.mocked(useCalculate).mockReturnValue(undefined);

    render(<CounterValue currency={getCryptoCurrencyById("bitcoin")} value={0} withPlaceholder />);

    expect(screen.getByTestId("countervalue-value")).toHaveTextContent("0");
  });
});
