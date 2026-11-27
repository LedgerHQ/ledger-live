import React from "react";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS } from "../../__tests__/orderDetails";
import { MIN_LOADING_DISPLAY_MS } from "../../pendingResultStore.internals";
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
    let walletOrderId = 0;
    act(() => {
      walletOrderId = startPredictionsOrder(ORDER_DETAILS);
    });
    expect(screen.getByLabelText(ORDER_COPY.placing)).toBeVisible();

    let report: Promise<string> = Promise.resolve("");
    act(() => {
      report = reportPredictionsOrder(walletOrderId, { status: "not-filled" });
      jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
    });
    expect(screen.getByLabelText(ORDER_COPY.notFilled.title)).toBeVisible();
    await user.click(screen.getByRole("button", { name: ORDER_COPY.tryAgain }));

    await expect(report).resolves.toBe("retry");
  });

  it("can't be closed while the order is placing, only once its result shows", () => {
    render(<PredictionsOrderSheet />, { wrapper: I18nWrapper });
    let walletOrderId = 0;
    act(() => {
      walletOrderId = startPredictionsOrder(ORDER_DETAILS);
    });
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    act(() => {
      void reportPredictionsOrder(walletOrderId, { status: "unconfirmed" });
      jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
    });

    expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(2);
  });
});
