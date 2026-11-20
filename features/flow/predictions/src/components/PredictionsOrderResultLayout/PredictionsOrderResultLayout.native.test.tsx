import React from "react";
import { Text } from "react-native";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS } from "../../__tests__/orderDetails";
import { PredictionsOrderResultLayout } from "./PredictionsOrderResultLayout";

const GLOW = <Text>glow</Text>;

describe("PredictionsOrderResultLayout", () => {
  it("shows the result over its glow, and answers from its buttons", async () => {
    const onClose = jest.fn();
    render(
      <PredictionsOrderResultLayout
        background={GLOW}
        result={{
          order: ORDER_DETAILS,
          report: { status: "filled", shares: 16.129, price: 0.31 },
          onClose,
          onRetry: jest.fn(),
        }}
      />,
      { wrapper: I18nWrapper },
    );

    const page = screen.getByTestId("predictions-order-result");
    expect(within(page).getByText("glow")).toBeOnTheScreen();
    expect(within(page).getByText("You bought 16.13 shares for $5.00")).toBeOnTheScreen();
    await userEvent.press(screen.getByText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays empty once the order is gone", () => {
    render(<PredictionsOrderResultLayout background={GLOW} result={null} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByTestId("predictions-order-result")).toBeOnTheScreen();
    expect(screen.queryByText("glow")).toBeNull();
    expect(screen.queryByText("Close")).toBeNull();
  });
});
