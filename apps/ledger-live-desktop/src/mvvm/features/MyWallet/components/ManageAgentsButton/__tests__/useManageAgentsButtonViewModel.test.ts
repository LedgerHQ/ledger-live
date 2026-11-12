import { renderHook, withFlagOverrides } from "tests/testSetup";
import { useManageAgentsButtonViewModel } from "../hooks/useManageAgentsButtonViewModel";

const mockNavigate = jest.fn();
const mockClose = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual<typeof import("react-router")>("react-router"),
  useNavigate: () => mockNavigate,
}));

jest.mock("LLD/features/MyWallet/components/ContextMenuContext", () => ({
  useContextMenuClose: () => mockClose,
}));

describe("useManageAgentsButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be disabled when the profile entry point is off", () => {
    const { result } = renderHook(() => useManageAgentsButtonViewModel(), {
      initialState: withFlagOverrides({
        agentIntent: { enabled: true, params: { navBar: true, profile: false } },
      }),
    });

    expect(result.current.isEnabled).toBe(false);
  });

  it("should expose the card wording with the new badge on the My Wallet page", () => {
    const { result } = renderHook(() => useManageAgentsButtonViewModel(), {
      initialState: withFlagOverrides({
        agentIntent: { enabled: true, params: { navBar: false, profile: true } },
      }),
    });

    expect(result.current).toMatchObject({
      isEnabled: true,
      title: "Manage your agents",
      description: "Let AI agents manage your assets.",
      newBadgeLabel: "New",
      page: "My Wallet",
    });
  });

  it("should open Agent Intent with the profile source and close the menu", () => {
    const { result } = renderHook(() => useManageAgentsButtonViewModel(), {
      initialState: withFlagOverrides({
        agentIntent: { enabled: true, params: { navBar: false, profile: true } },
      }),
    });

    result.current.openAgentIntent();

    expect(mockNavigate).toHaveBeenCalledWith("/agent-intent?source=profile");
    expect(mockClose).toHaveBeenCalled();
  });
});
