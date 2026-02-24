import { renderHook } from "tests/testSetup";
import { useLazyOnboardingActions } from "../useLazyOnboardingActions";
import * as LinkingHelpers from "~/renderer/linking";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("useLazyOnboardingActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns a function for buy device action", () => {
    const { result } = renderHook(() => useLazyOnboardingActions());
    result.current.handleBuyDevice();
    expect(LinkingHelpers.openURL).toHaveBeenCalled();
  });

  it("returns a function for connect action", () => {
    const { result } = renderHook(() => useLazyOnboardingActions());
    result.current.handleConnect();
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/select-device", {
      state: { fromQuickAction: true },
    });
  });
});
