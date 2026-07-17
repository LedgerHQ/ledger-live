import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useContactsButtonViewModel } from "../useContactsButtonViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("useContactsButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be disabled when lwmContacts is off", () => {
    const { result } = renderHook(() => useContactsButtonViewModel(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: false, params: { newBadge: false } },
      }),
    });

    expect(result.current.isEnabled).toBe(false);
  });

  it("should navigate to contacts and expose the new badge label when enabled", () => {
    const { result } = renderHook(() => useContactsButtonViewModel(), {
      overrideInitialState: withFlagOverrides({
        lwmContacts: { enabled: true, params: { newBadge: true } },
      }),
    });

    result.current.handleClick();

    expect(mockNavigate).toHaveBeenCalledWith("MyWalletContacts");
    expect(result.current.newBadgeLabel).toBe("New");
  });
});
