import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { MIN_RESULT_DISPLAY_MS } from "../../pendingResultStore.internals";
import {
  closePredictionsOrder,
  reportPredictionsOrder,
  startPredictionsOrder,
} from "../../predictionsOrderStore.internals";
import { PredictionsOrderSheet } from "./PredictionsOrderSheet";

describe("PredictionsOrderSheet (web)", () => {
  beforeEach(() => jest.useFakeTimers());

  afterEach(() => {
    act(() => closePredictionsOrder());
    jest.useRealTimers();
  });

  // Lumen's stub renders the dialog as a plain element, so its name is checked through its label.
  it("names the dialog after what it shows, and answers retry when the user tries again", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<PredictionsOrderSheet />, { wrapper: I18nWrapper });
    let orderId = 0;
    act(() => {
      orderId = startPredictionsOrder();
    });
    expect(screen.getByLabelText(ORDER_COPY.placing)).toBeVisible();

    let report: Promise<string> = Promise.resolve("");
    act(() => {
      report = reportPredictionsOrder(orderId, { outcome: "not-filled" });
      jest.advanceTimersByTime(MIN_RESULT_DISPLAY_MS);
    });
    expect(screen.getByLabelText(ORDER_COPY.notFilled.title)).toBeVisible();
    await user.click(screen.getByRole("button", { name: ORDER_COPY.tryAgain }));

    await expect(report).resolves.toBe("retry");
  });
});
