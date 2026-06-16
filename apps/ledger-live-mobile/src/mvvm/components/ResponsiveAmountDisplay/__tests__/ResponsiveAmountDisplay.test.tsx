import React from "react";
import { render, screen, fireEvent } from "@tests/test-renderer";
import type { FormattedValue } from "@ledgerhq/lumen-ui-rnative";
import { ResponsiveAmountDisplay } from "..";

// Mock AmountDisplay so we can assert which `size` the wrapper resolves to and
// drive its `onLayout` callback, without depending on the design system internals.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const ReactLocal = require("react");
  const { View, Text } = require("react-native");
  return {
    ...actual,
    AmountDisplay: ({ size, onLayout, testID }: { size: string } & Record<string, unknown>) =>
      ReactLocal.createElement(
        View,
        { testID, onLayout },
        ReactLocal.createElement(Text, { testID: "amount-size" }, size),
      ),
  };
});

// The hero leaves 16px padding on each side, so available width = 400 - 32 = 368.
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ width: 400, height: 800, scale: 1, fontScale: 1 }),
}));

const formatter = (value: number): FormattedValue => ({
  integerPart: String(value),
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

const fireLayout = (testID: string, width: number) =>
  fireEvent(screen.getByTestId(testID), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width, height: 48 } },
  });

describe("ResponsiveAmountDisplay", () => {
  describe("size resolution", () => {
    it("renders at md by default", () => {
      render(<ResponsiveAmountDisplay value={1234} formatter={formatter} testID="amount" />);

      expect(screen.getByTestId("amount-size")).toHaveTextContent("md");
    });

    it("downgrades to sm when the rendered amount exceeds the available width", () => {
      render(<ResponsiveAmountDisplay value={1234} formatter={formatter} testID="amount" />);

      fireLayout("amount", 500);

      expect(screen.getByTestId("amount-size")).toHaveTextContent("sm");
    });

    it("keeps md when the rendered amount fits within the available width", () => {
      render(<ResponsiveAmountDisplay value={1234} formatter={formatter} testID="amount" />);

      fireLayout("amount", 200);

      expect(screen.getByTestId("amount-size")).toHaveTextContent("md");
    });

    it("respects a custom horizontalInset when deciding to downgrade", () => {
      // available width = 400 - 360 = 40, so a 100px amount overflows.
      render(
        <ResponsiveAmountDisplay
          value={1234}
          formatter={formatter}
          horizontalInset={360}
          testID="amount"
        />,
      );

      fireLayout("amount", 100);

      expect(screen.getByTestId("amount-size")).toHaveTextContent("sm");
    });
  });

  describe("prop forwarding", () => {
    it("forwards testID to the underlying AmountDisplay", () => {
      render(<ResponsiveAmountDisplay value={1234} formatter={formatter} testID="amount" />);

      expect(screen.getByTestId("amount")).toBeVisible();
    });

    it("forwards onLayout to the caller", () => {
      const onLayout = jest.fn();
      render(
        <ResponsiveAmountDisplay
          value={1234}
          formatter={formatter}
          testID="amount"
          onLayout={onLayout}
        />,
      );

      fireLayout("amount", 200);

      expect(onLayout).toHaveBeenCalledTimes(1);
    });
  });
});
