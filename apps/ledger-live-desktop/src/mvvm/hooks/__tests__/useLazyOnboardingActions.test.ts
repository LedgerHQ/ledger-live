import { useNavigate } from "react-router";
import { renderHook, waitFor } from "tests/testSetup";
import useLazyOnboardingActions from "../useLazyOnboardingActions";
import * as LinkingHelpers from "~/renderer/linking";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

describe("useLazyOnboardingActions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("returns a function for buy device action", async () => {
    jest.spyOn(LinkingHelpers, "openURL");
    const { result } = renderHook(() => useLazyOnboardingActions());
    result.current.handleBuyDevice();
    expect(LinkingHelpers.openURL).toHaveBeenCalled();
  });

  it("returns a function for connect action", async () => {
    const { result } = renderHook(() => useLazyOnboardingActions());
    result.current.handleConnect();
    expect(mockNavigate).toHaveBeenCalledWith("/onboarding/select-device", {
      state: { fromQuickAction: true },
    });
  });
});
