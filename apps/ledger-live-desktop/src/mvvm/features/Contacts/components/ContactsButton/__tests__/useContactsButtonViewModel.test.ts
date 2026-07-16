import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useContactsButtonViewModel } from "../useContactsButtonViewModel";

const mockNavigate = jest.fn();
const mockClose = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/MyWallet/components/ContextMenuContext", () => ({
  useContextMenuClose: () => mockClose,
}));

describe("useContactsButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be disabled when lwdContacts is off", () => {
    const { result } = renderHook(() => useContactsButtonViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: { enabled: false, params: { newBadge: false } },
      }),
    });

    expect(result.current.isEnabled).toBe(false);
  });

  it("should navigate to contacts and close the menu when clicked", () => {
    const { result } = renderHook(() => useContactsButtonViewModel(), {
      initialState: withFlagOverrides({
        lwdContacts: { enabled: true, params: { newBadge: true } },
      }),
    });

    result.current.handleClick();

    expect(mockNavigate).toHaveBeenCalledWith("/contacts");
    expect(mockClose).toHaveBeenCalled();
    expect(result.current.newBadgeLabel).toBe("New");
  });
});
