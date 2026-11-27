import { BackHandler } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { act, renderHook } from "@tests/test-renderer";
import {
  answerPredictionsOrder,
  usePredictionsOrderResult,
} from "@features/flow-predictions/native";
import { usePredictionsOrderResultViewModel } from "../usePredictionsOrderResultViewModel";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useFocusEffect: jest.fn(),
}));

type BackPressHandler = () => boolean | null | undefined;

const backPressHandlers: BackPressHandler[] = [];

jest.mock("@features/flow-predictions/native", () => ({
  ...jest.requireActual("@features/flow-predictions/native"),
  answerPredictionsOrder: jest.fn(),
  usePredictionsOrderResult: jest.fn(),
}));

const ORDER_ID = 7;
const RESULT = {
  order: {
    display: { marketTitle: "Fed decision in December?", outcomeLabel: "Yes" },
    amountPaid: 2,
  },
  report: { status: "not-filled" },
} as const;

function renderViewModel() {
  let leave: () => void = () => {};
  const goBack = jest.fn();
  const navigation = {
    goBack,
    addListener: jest.fn((_event: string, listener: () => void) => {
      leave = listener;
      return jest.fn();
    }),
  };
  const props = { navigation, route: { params: { orderId: ORDER_ID } } } as never;
  const { result } = renderHook(() => usePredictionsOrderResultViewModel(props));

  return { result, goBack, leave: () => leave() };
}

describe("usePredictionsOrderResultViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usePredictionsOrderResult).mockReturnValue(RESULT);
    backPressHandlers.length = 0;
    jest.spyOn(BackHandler, "addEventListener").mockImplementation((_event, handler) => {
      backPressHandlers.push(handler);
      return {
        remove: () => {
          backPressHandlers.splice(backPressHandlers.indexOf(handler), 1);
        },
      };
    });
  });

  it("shows the order's result in its tone", () => {
    const { result } = renderViewModel();

    expect(usePredictionsOrderResult).toHaveBeenCalledWith(ORDER_ID);
    expect(result.current.result).toBe(RESULT);
    expect(result.current.tone).toBe("error");
  });

  it("answers close and goes back to the live app on Close", () => {
    const { result, goBack } = renderViewModel();

    act(() => result.current.handleClose());

    expect(answerPredictionsOrder).toHaveBeenCalledWith(ORDER_ID, "close");
    expect(goBack).toHaveBeenCalled();
  });

  it("answers retry and goes back to the live app on Try again", () => {
    const { result, goBack } = renderViewModel();

    act(() => result.current.handleRetry());

    expect(answerPredictionsOrder).toHaveBeenCalledWith(ORDER_ID, "retry");
    expect(goBack).toHaveBeenCalled();
  });

  it("answers close when the page is left another way, like the Android back button", () => {
    const { leave } = renderViewModel();

    leave();

    expect(answerPredictionsOrder).toHaveBeenCalledWith(ORDER_ID, "close");
  });

  it("answers close on the Android back button before the live app's player can take it", () => {
    const playerBack = jest.fn(() => true);
    BackHandler.addEventListener("hardwareBackPress", playerBack);
    const { goBack } = renderViewModel();
    const focusPage = jest.mocked(useFocusEffect).mock.calls.at(-1)?.[0];
    act(() => {
      focusPage?.();
    });

    let isConsumed = false;
    act(() => {
      // Like React Native: the latest listener first, until one takes it.
      isConsumed = [...backPressHandlers].reverse().some(handler => handler() === true);
    });

    expect(isConsumed).toBe(true);
    expect(playerBack).not.toHaveBeenCalled();
    expect(answerPredictionsOrder).toHaveBeenCalledWith(ORDER_ID, "close");
    expect(goBack).toHaveBeenCalled();
  });
});
