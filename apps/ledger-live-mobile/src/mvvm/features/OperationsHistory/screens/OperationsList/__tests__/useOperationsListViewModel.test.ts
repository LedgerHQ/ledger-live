import { act } from "@testing-library/react-native";
import { renderHook } from "@tests/test-renderer";
import { useOperationsListViewModel } from "../useOperationsListViewModel";

// ─── Hook behaviours — mock needed because useOperationsV1 uses selectors ───

const mockUseOperationsV1 = jest.fn();

jest.mock("~/screens/Analytics/Operations/useOperationsV1", () => ({
  useOperationsV1: (...args: unknown[]) => mockUseOperationsV1(...args),
}));

describe("useOperationsListViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOperationsV1.mockReturnValue({ sections: [], completed: true });
  });

  it("isEmpty is true when completed with no sections", () => {
    const { result } = renderHook(() => useOperationsListViewModel());
    expect(result.current.isEmpty).toBe(true);
  });

  it("isEmpty is false when not completed", () => {
    mockUseOperationsV1.mockReturnValue({ sections: [], completed: false });
    const { result } = renderHook(() => useOperationsListViewModel());
    expect(result.current.isEmpty).toBe(false);
  });

  it("onEndReached increments the operation count when not completed", () => {
    mockUseOperationsV1.mockReturnValue({ sections: [], completed: false });
    const { result } = renderHook(() => useOperationsListViewModel());
    const firstCallCount = mockUseOperationsV1.mock.calls.length;

    act(() => result.current.onEndReached());

    expect(mockUseOperationsV1.mock.calls.length).toBeGreaterThan(firstCallCount);
    const lastArgs = mockUseOperationsV1.mock.calls.at(-1);
    expect(lastArgs[1]).toBeGreaterThan(50); // opCount increased beyond initial
  });

  it("onEndReached does nothing when already completed", () => {
    const { result } = renderHook(() => useOperationsListViewModel());
    const callsBefore = mockUseOperationsV1.mock.calls.length;

    act(() => result.current.onEndReached());

    expect(mockUseOperationsV1.mock.calls.length).toBe(callsBefore);
  });
});
