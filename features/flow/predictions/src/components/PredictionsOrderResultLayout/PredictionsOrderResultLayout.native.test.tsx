import React from "react";
import { Text } from "react-native";
import { render, screen, userEvent, within } from "@testing-library/react-native";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { PredictionsOrderResultLayout } from "./PredictionsOrderResultLayout";

const GLOW = <Text>glow</Text>;

describe("PredictionsOrderResultLayout", () => {
  it("shows the result over its glow, and answers from its buttons", async () => {
    const onClose = jest.fn();
    render(
      <PredictionsOrderResultLayout
        background={GLOW}
        result={{
          report: { status: "filled", shares: 3.7, price: 0.54 },
          onClose,
          onRetry: jest.fn(),
        }}
      />,
      { wrapper: I18nWrapper },
    );

    const page = screen.getByTestId("predictions-order-result");
    expect(within(page).getByText("glow")).toBeOnTheScreen();
    expect(within(page).getByText("3.7 shares at $0.54")).toBeOnTheScreen();
    await userEvent.press(screen.getByText(ORDER_COPY.filled.return));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays empty once the order is gone", () => {
    render(<PredictionsOrderResultLayout background={GLOW} result={null} />, {
      wrapper: I18nWrapper,
    });

    expect(screen.getByTestId("predictions-order-result")).toBeOnTheScreen();
    expect(screen.queryByText("glow")).toBeNull();
    expect(screen.queryByText(ORDER_COPY.filled.return)).toBeNull();
  });
});
