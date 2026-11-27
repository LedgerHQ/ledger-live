import { useIsFocused, useNavigation } from "@react-navigation/native";
import { renderHook } from "@tests/test-renderer";
import { usePredictionsOrderAwaitingResultPage } from "@features/flow-predictions/native";
import { ScreenName } from "~/const";
import { useOpenPredictionsOrderResult } from "../useOpenPredictionsOrderResult";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock("@features/flow-predictions/native", () => ({
  ...jest.requireActual("@features/flow-predictions/native"),
  usePredictionsOrderAwaitingResultPage: jest.fn(),
}));

const ORDER_ID = 5;

// Each player reads its own focus and navigation: only the one rendered reads the mocks.
function renderPlayer({ ownsOrder, isFocused }: { ownsOrder: boolean; isFocused: boolean }) {
  const navigation = { navigate: jest.fn() };
  const ownsOrderId = (orderId: number) => ownsOrder && orderId === ORDER_ID;
  const pointMocksAtPlayer = (isNowFocused: boolean) => {
    jest.mocked(useIsFocused).mockReturnValue(isNowFocused);
    jest.mocked(useNavigation).mockReturnValue(navigation);
  };
  pointMocksAtPlayer(isFocused);
  const { rerender } = renderHook(() => useOpenPredictionsOrderResult(ownsOrderId));
  return {
    navigate: navigation.navigate,
    setFocused: (isNowFocused: boolean) => {
      pointMocksAtPlayer(isNowFocused);
      rerender({});
    },
  };
}

describe("useOpenPredictionsOrderResult", () => {
  beforeEach(() => {
    jest.mocked(usePredictionsOrderAwaitingResultPage).mockReturnValue(ORDER_ID);
  });

  it("opens the result page only from the live app that started the order, once it's in front", () => {
    const owner = renderPlayer({ ownsOrder: true, isFocused: false });
    const other = renderPlayer({ ownsOrder: false, isFocused: true });

    expect(other.navigate).not.toHaveBeenCalled();
    expect(owner.navigate).not.toHaveBeenCalled();

    other.setFocused(false);
    owner.setFocused(true);

    expect(other.navigate).not.toHaveBeenCalled();
    expect(owner.navigate).toHaveBeenCalledTimes(1);
    expect(owner.navigate).toHaveBeenCalledWith(ScreenName.PredictionsOrderResult, {
      orderId: ORDER_ID,
    });
  });
});
