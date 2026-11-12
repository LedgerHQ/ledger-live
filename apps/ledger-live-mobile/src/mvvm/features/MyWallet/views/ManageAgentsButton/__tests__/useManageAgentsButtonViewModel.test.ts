import { track } from "@shared/analytics";
import { renderHook, withFlagOverrides } from "@tests/test-renderer";
import { useManageAgentsButtonViewModel } from "../useManageAgentsButtonViewModel";

const mockNavigate = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual<typeof import("@react-navigation/native")>("@react-navigation/native"),
  useNavigation: () => ({ navigate: mockNavigate }),
}));

describe("useManageAgentsButtonViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should be disabled when the profile entry point is off", () => {
    const { result } = renderHook(() => useManageAgentsButtonViewModel(), {
      overrideInitialState: withFlagOverrides({
        agentIntent: { enabled: true, params: { navBar: true, profile: false } },
      }),
    });

    expect(result.current.isEnabled).toBe(false);
  });

  it("should be disabled when the flag is off", () => {
    const { result } = renderHook(() => useManageAgentsButtonViewModel(), {
      overrideInitialState: withFlagOverrides({
        agentIntent: { enabled: false, params: { navBar: false, profile: true } },
      }),
    });

    expect(result.current.isEnabled).toBe(false);
  });

  it("should track the click and open Agent Intent with the profile source", () => {
    const { result } = renderHook(() => useManageAgentsButtonViewModel(), {
      overrideInitialState: withFlagOverrides({
        agentIntent: { enabled: true, params: { navBar: false, profile: true } },
      }),
    });

    result.current.openAgentIntent();

    expect(track).toHaveBeenCalledWith("button_clicked", {
      button: "agent_intent",
      entry: "agent_intent",
      source: "profile",
      page: "My Wallet",
    });
    expect(mockNavigate).toHaveBeenCalledWith("AgentIntentNavigator", {
      screen: "AgentIntent",
      params: { source: "profile" },
    });
  });
});
