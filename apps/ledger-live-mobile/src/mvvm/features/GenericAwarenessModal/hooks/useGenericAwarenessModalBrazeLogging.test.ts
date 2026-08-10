import { act, renderHook } from "@tests/test-renderer";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import { useGenericAwarenessModalBrazeLogging } from "./useGenericAwarenessModalBrazeLogging";

const mockLogImpressionCard = jest.fn();
const mockLogClickCard = jest.fn();
const mockLogDismissCard = jest.fn();

jest.mock("~/dynamicContent/useDynamicContent", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseDynamicContent = useDynamicContent as jest.MockedFunction<typeof useDynamicContent>;

describe("useGenericAwarenessModalBrazeLogging", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDynamicContent.mockReturnValue({
      logImpressionCard: mockLogImpressionCard,
      logClickCard: mockLogClickCard,
      logDismissCard: mockLogDismissCard,
    } as unknown as ReturnType<typeof useDynamicContent>);
  });

  it("should log one impression per open and not repeat on rerender", () => {
    let isOpen = true;
    const { rerender } = renderHook(() => useGenericAwarenessModalBrazeLogging("card-1", isOpen));

    expect(mockLogImpressionCard).toHaveBeenCalledTimes(1);
    expect(mockLogImpressionCard).toHaveBeenCalledWith("card-1");

    rerender(undefined);
    expect(mockLogImpressionCard).toHaveBeenCalledTimes(1);
  });

  it("should reset impression dedup when isOpen toggles off and log again on reopen", () => {
    let isOpen = true;
    const { rerender } = renderHook(() => useGenericAwarenessModalBrazeLogging("card-1", isOpen));

    expect(mockLogImpressionCard).toHaveBeenCalledTimes(1);

    isOpen = false;
    rerender(undefined);
    expect(mockLogImpressionCard).toHaveBeenCalledTimes(1);

    isOpen = true;
    rerender(undefined);
    expect(mockLogImpressionCard).toHaveBeenCalledTimes(2);
  });

  it("should log click and dismiss for the content card id", () => {
    const { result } = renderHook(() => useGenericAwarenessModalBrazeLogging("card-1", true));

    act(() => {
      result.current.logClick();
      result.current.logDismiss();
    });

    expect(mockLogClickCard).toHaveBeenCalledWith("card-1");
    expect(mockLogDismissCard).toHaveBeenCalledWith("card-1");
  });
});
