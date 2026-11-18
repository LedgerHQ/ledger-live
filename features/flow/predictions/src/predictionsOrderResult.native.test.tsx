import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import type { PredictionsOrderReport } from "@features/platform-predictions";
import { I18nWrapper } from "./__tests__/i18nWrapper";
import { PredictionsOrderSheet } from "./components/PredictionsOrderSheet/PredictionsOrderSheet";
import { MIN_LOADING_DISPLAY_MS } from "./pendingResultStore.internals";
import {
  closePredictionsOrder,
  reportPredictionsOrder,
  startPredictionsOrder,
} from "./predictionsOrderStore.internals";
import {
  answerPredictionsOrder,
  usePredictionsOrderAwaitingResultPage,
  usePredictionsOrderResult,
} from "./predictionsOrderResult";

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  BackHandler: { addEventListener: () => ({ remove: () => {} }) },
}));

const FILLED: PredictionsOrderReport = { status: "filled", shares: 3, price: 0.5 };

function AwaitingPage() {
  const orderId = usePredictionsOrderAwaitingResultPage();
  return <Text testID="awaiting">{orderId ?? "none"}</Text>;
}

function ResultPage({ orderId }: Readonly<{ orderId: number }>) {
  const result = usePredictionsOrderResult(orderId);
  return <Text testID="result">{result?.report.status ?? "none"}</Text>;
}

const awaiting = () => screen.getByTestId("awaiting").props.children;

function startOrder() {
  let orderId = 0;
  act(() => {
    orderId = startPredictionsOrder();
  });
  return orderId;
}

function report(orderId: number) {
  let answer: Promise<string> = Promise.resolve("");
  act(() => {
    answer = reportPredictionsOrder(orderId, FILLED);
    jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
  });
  return answer;
}

const finishHidingSheet = () =>
  fireEvent.press(screen.getByTestId("predictions-order-sheet-hidden"));

describe("Predictions order result page", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => closePredictionsOrder());
    jest.useRealTimers();
  });

  it("waits for the placing sheet to leave the screen before the result gets its page", () => {
    render(
      <>
        <PredictionsOrderSheet />
        <AwaitingPage />
      </>,
      { wrapper: I18nWrapper },
    );
    const orderId = startOrder();
    expect(awaiting()).toBe("none");

    void report(orderId);
    expect(awaiting()).toBe("none");
    finishHidingSheet();

    expect(awaiting()).toBe(orderId);
  });

  it("answers its own order, and keeps showing its result once answered", async () => {
    render(<PredictionsOrderSheet />, { wrapper: I18nWrapper });
    const orderId = startOrder();
    const answer = report(orderId);
    render(<ResultPage orderId={orderId} />, { wrapper: I18nWrapper });
    expect(screen.getByTestId("result").props.children).toBe("filled");

    act(() => answerPredictionsOrder(orderId, "retry"));

    await expect(answer).resolves.toBe("retry");
    expect(screen.getByTestId("result").props.children).toBe("filled");
  });

  it("leaves a newer order alone when an older page answers", () => {
    render(
      <>
        <PredictionsOrderSheet />
        <AwaitingPage />
      </>,
      { wrapper: I18nWrapper },
    );
    const olderOrderId = startOrder();
    const newerOrderId = startOrder();
    void report(newerOrderId);
    finishHidingSheet();

    act(() => answerPredictionsOrder(olderOrderId, "close"));

    expect(awaiting()).toBe(newerOrderId);
  });
});
