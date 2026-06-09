import { getStateFromPath } from "@react-navigation/native";
import { tickBackupHubFeatureIntroDeeplink } from "~/reducers/backupHubFeatureIntro";
import { handleBackupHubDeeplink } from "../handleBackupHubDeeplink";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  getStateFromPath: jest.fn(),
}));

const mockGetStateFromPath = jest.mocked(getStateFromPath);

describe("handleBackupHubDeeplink", () => {
  const config = { screens: {} } as Parameters<typeof getStateFromPath>[1];
  const portfolioState = { routes: [{ name: "Portfolio" }] };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetStateFromPath.mockReturnValue(portfolioState);
  });

  it("should tick backup hub deeplink and navigate to portfolio when enabled and onboarding is complete", () => {
    const dispatch = jest.fn();

    const result = handleBackupHubDeeplink({
      isLwmBackupHubEnabled: true,
      hasCompletedOnboarding: true,
      dispatch,
      config,
    });

    expect(dispatch).toHaveBeenCalledWith(tickBackupHubFeatureIntroDeeplink());
    expect(mockGetStateFromPath).toHaveBeenCalledWith("portfolio", config);
    expect(result).toBe(portfolioState);
  });

  it("should ignore the deeplink when the feature is disabled", () => {
    const dispatch = jest.fn();

    const result = handleBackupHubDeeplink({
      isLwmBackupHubEnabled: false,
      hasCompletedOnboarding: true,
      dispatch,
      config,
    });

    expect(result).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
    expect(mockGetStateFromPath).not.toHaveBeenCalled();
  });

  it("should ignore the deeplink when onboarding is not complete", () => {
    const dispatch = jest.fn();

    const result = handleBackupHubDeeplink({
      isLwmBackupHubEnabled: true,
      hasCompletedOnboarding: false,
      dispatch,
      config,
    });

    expect(result).toBeUndefined();
    expect(dispatch).not.toHaveBeenCalled();
    expect(mockGetStateFromPath).not.toHaveBeenCalled();
  });
});
