import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { I18nWrapper, ORDER_COPY } from "../../__tests__/i18nWrapper";
import { ORDER_DETAILS } from "../../__tests__/orderDetails";
import { MIN_LOADING_DISPLAY_MS } from "../../pendingResultStore.internals";
import {
  closePredictionsOrder,
  reportPredictionsOrder,
  startPredictionsOrder,
} from "../../predictionsOrderStore.internals";
import { PredictionsOrderSheet } from "./PredictionsOrderSheet";

type BackPressHandler = () => boolean | null | undefined;

const mockBackPressHandlers: BackPressHandler[] = [];

jest.mock("react-native", () => ({
  ...jest.requireActual("react-native"),
  useWindowDimensions: () => ({ width: 390, height: 844, scale: 3, fontScale: 1 }),
  BackHandler: {
    addEventListener: (_event: string, handler: BackPressHandler) => {
      mockBackPressHandlers.push(handler);
      return {
        remove: () => {
          const index = mockBackPressHandlers.indexOf(handler);
          if (index !== -1) mockBackPressHandlers.splice(index, 1);
        },
      };
    },
  },
}));

const SHEET = "predictions-order-sheet";
const isSheetOpen = () => screen.getByTestId(SHEET).props.accessibilityState.expanded === true;

function pressAndroidBack() {
  let isConsumed: boolean | null | undefined;
  act(() => {
    isConsumed = mockBackPressHandlers.at(-1)?.();
  });
  return isConsumed;
}

function startShownOrder() {
  render(<PredictionsOrderSheet />, { wrapper: I18nWrapper });
  let walletOrderId = 0;
  act(() => {
    walletOrderId = startPredictionsOrder(ORDER_DETAILS);
  });
  return walletOrderId;
}

function reportShown(walletOrderId: number, report: Parameters<typeof reportPredictionsOrder>[1]) {
  let answer: Promise<string> = Promise.resolve("");
  act(() => {
    answer = reportPredictionsOrder(walletOrderId, report);
    jest.advanceTimersByTime(MIN_LOADING_DISPLAY_MS);
  });
  return answer;
}

describe("PredictionsOrderSheet (native)", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => {
    act(() => closePredictionsOrder());
    mockBackPressHandlers.length = 0;
    jest.useRealTimers();
  });

  it("stays closed while no order is open", () => {
    render(<PredictionsOrderSheet />, { wrapper: I18nWrapper });

    expect(isSheetOpen()).toBe(false);
    expect(mockBackPressHandlers).toHaveLength(0);
  });

  it("shows the order being placed with no close button or backdrop", () => {
    startShownOrder();

    expect(isSheetOpen()).toBe(true);
    expect(screen.getByText(ORDER_COPY.placing)).toBeOnTheScreen();
    expect(screen.queryByTestId(`${SHEET}-header-close`)).toBeNull();
    expect(screen.queryByTestId(`${SHEET}-backdrop`)).toBeNull();
  });

  it("keeps the order being placed on the Android back button", () => {
    startShownOrder();

    expect(pressAndroidBack()).toBe(true);

    expect(isSheetOpen()).toBe(true);
    expect(screen.getByText(ORDER_COPY.placing)).toBeOnTheScreen();
  });

  it("closes once the result is in, leaving it to its page", () => {
    reportShown(startShownOrder(), { status: "filled", shares: 3, price: 0.5 });

    expect(isSheetOpen()).toBe(false);
    expect(screen.queryByText(ORDER_COPY.filled.title)).toBeNull();
  });

  it("keeps taking the Android back button while it leaves, until it's hidden", () => {
    reportShown(startShownOrder(), { status: "filled", shares: 3, price: 0.5 });
    expect(isSheetOpen()).toBe(false);

    expect(pressAndroidBack()).toBe(true);

    fireEvent.press(screen.getByTestId(`${SHEET}-hidden`));
    expect(mockBackPressHandlers).toHaveLength(0);
  });
});
