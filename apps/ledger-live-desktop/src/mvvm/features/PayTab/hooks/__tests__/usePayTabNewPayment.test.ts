import { renderHook, act } from "tests/testSetup";
import { AssetCategory } from "@domain/api-aggregated-assets";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";
import { usePayTabNewPayment } from "../usePayTabNewPayment";

jest.mock("LLD/features/Send/hooks/useOpenSendFlow");

const mockOpenSendFlow = jest.fn();
const mockUseOpenSendFlow = useOpenSendFlow as jest.MockedFunction<typeof useOpenSendFlow>;

describe("usePayTabNewPayment", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOpenSendFlow.mockReturnValue(mockOpenSendFlow);
  });

  it("opens the send flow from the Pay page filtered to stablecoins", () => {
    const { result } = renderHook(() => usePayTabNewPayment());

    act(() => result.current.open());

    expect(mockOpenSendFlow).toHaveBeenCalledWith({
      source: "Pay",
      categories: [AssetCategory.Stablecoins],
    });
  });
});
