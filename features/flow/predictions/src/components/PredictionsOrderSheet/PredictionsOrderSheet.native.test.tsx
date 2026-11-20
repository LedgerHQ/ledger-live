import React from "react";
import { View } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import {
  QueuedBottomSheetsProvider,
  type QueuedBottomSheetAdapters,
  useQueuedBottomSheetContext,
} from "@shared/ui-queued-bottom-sheet";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS } from "../../__tests__/orderDetails";
import { MIN_RESULT_DISPLAY_MS } from "../../pendingResultStore.internals";
import {
  closePredictionsOrder,
  reportPredictionsOrder,
  startPredictionsOrder,
} from "../../predictionsOrderStore.internals";
import { PredictionsOrderSheet } from "./PredictionsOrderSheet";

const SuccessGlow = () => <View testID="success-glow" />;

const adapters: QueuedBottomSheetAdapters = {
  useAreBottomSheetsLocked: () => false,
  useIsScreenFocused: () => true,
  backgroundComponentByTone: { success: SuccessGlow },
  log: () => {},
};

let removeSheetAhead = () => {};

/** A sheet already in the queue, like the signing prompt before the order. */
function SheetAhead() {
  const { addBottomSheetToQueue } = useQueuedBottomSheetContext();
  React.useEffect(() => {
    const queued = addBottomSheetToQueue({ open: () => {}, close: () => {} }, false);
    removeSheetAhead = queued.removeBottomSheetFromQueue;
  }, [addBottomSheetToQueue]);
  return null;
}

function renderScreen({ withSheetAhead = false } = {}) {
  render(
    <QueuedBottomSheetsProvider adapters={adapters}>
      {withSheetAhead ? <SheetAhead /> : null}
      <PredictionsOrderSheet />
    </QueuedBottomSheetsProvider>,
    { wrapper: I18nWrapper },
  );
}

const orderScreen = () => screen.queryByTestId("predictions-order-sheet");

function startShownOrder() {
  let orderId = 0;
  act(() => {
    orderId = startPredictionsOrder(ORDER_DETAILS);
  });
  return orderId;
}

describe("PredictionsOrderSheet (native)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => closePredictionsOrder());
    jest.useRealTimers();
  });

  it("shows nothing while no order is open", () => {
    renderScreen();

    expect(orderScreen()).toBeNull();
  });

  it("waits for the sheet before it, then shows the order being placed full screen", () => {
    renderScreen({ withSheetAhead: true });
    act(() => {
      startPredictionsOrder(ORDER_DETAILS);
    });
    expect(orderScreen()).toBeNull();

    act(() => removeSheetAhead());

    expect(orderScreen()).toBeOnTheScreen();
    expect(screen.getByText(ORDER_COPY.placing)).toBeOnTheScreen();
  });

  it("shows the outcome with its glow once on screen long enough, and answers close when closed", async () => {
    renderScreen();
    const orderId = startShownOrder();

    let report: Promise<string> = Promise.resolve("");
    act(() => {
      report = reportPredictionsOrder(orderId, { outcome: "filled", shares: 3, price: 0.5 });
      jest.advanceTimersByTime(MIN_RESULT_DISPLAY_MS);
    });
    expect(screen.getByText(ORDER_COPY.filled.title)).toBeOnTheScreen();
    expect(screen.getByTestId("success-glow")).toBeOnTheScreen();
    act(() => fireEvent.press(screen.getByText("Close")));

    await expect(report).resolves.toBe("close");
    expect(orderScreen()).toBeNull();
  });

  it("closes on the Android back button, answering close", async () => {
    renderScreen();
    const orderId = startShownOrder();
    let report: Promise<string> = Promise.resolve("");
    act(() => {
      report = reportPredictionsOrder(orderId, { outcome: "not-filled" });
    });

    act(() => fireEvent(screen.getByTestId("predictions-order-sheet"), "requestClose"));

    await expect(report).resolves.toBe("close");
    expect(orderScreen()).toBeNull();
  });
});
