import { act, renderHook } from "@tests/test-renderer";
import { openSwapTransactionStatusDrawer } from "~/reducers/swapTransactionStatusDrawer";
import {
  usePerpsTransactionSignedViewModel,
  type PerpsTransactionSignedParams,
} from "../usePerpsTransactionSignedViewModel";

const mockDispatch = jest.fn();
jest.mock("~/context/hooks", () => ({
  ...jest.requireActual("~/context/hooks"),
  useDispatch: () => mockDispatch,
}));

const SIGNED_PARAMS: PerpsTransactionSignedParams = {
  receiveCurrencyTicker: "USDC",
  swapId: "swap-1",
  provider: "swapkit",
};

function renderViewModel(params: PerpsTransactionSignedParams = SIGNED_PARAMS) {
  const goBack = jest.fn();
  const props = { navigation: { goBack }, route: { params } } as never;
  const { result } = renderHook(() => usePerpsTransactionSignedViewModel(props));

  return { result, goBack };
}

describe("usePerpsTransactionSignedViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("names the currency the deposit credits", () => {
    const { result } = renderViewModel();

    expect(result.current.receiveCurrencyTicker).toBe("USDC");
  });

  it("hands the swap to the status drawer, which tracks it from there", () => {
    const { result, goBack } = renderViewModel();

    act(() => result.current.handleViewTransaction?.());

    expect(goBack).toHaveBeenCalled();
    expect(mockDispatch).toHaveBeenCalledWith(
      openSwapTransactionStatusDrawer({ swapId: "swap-1", provider: "swapkit" }),
    );
  });

  it("offers nothing to track when the provider issued no swap id", () => {
    const { result } = renderViewModel({ receiveCurrencyTicker: "USDC" });

    expect(result.current.handleViewTransaction).toBeUndefined();
  });

  it("closes back to whatever opened the deposit", () => {
    const { result, goBack } = renderViewModel();

    act(() => result.current.handleClose());

    expect(goBack).toHaveBeenCalled();
  });
});
