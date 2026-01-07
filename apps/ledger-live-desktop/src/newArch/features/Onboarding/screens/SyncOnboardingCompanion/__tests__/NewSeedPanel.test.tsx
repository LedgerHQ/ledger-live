import React from "react";
import { render, screen } from "tests/testSetup";

import NewSeedPanel from "../components/NewSeedPanel";
import { track } from "~/renderer/analytics/segment";
import { State } from "~/renderer/reducers";
import * as UseOpenAssetFlow from "LLD/features/ModularDrawer/hooks/useOpenAssetFlow";
import { analyticsFlowName } from "~/renderer/components/SyncOnboarding/Manual/shared";

jest.mock("~/renderer/analytics/segment", () => ({
  ...jest.requireActual("~/renderer/analytics/segment"),
  track: jest.fn(),
}));

jest.mock("LLD/features/ModularDrawer/hooks/useOpenAssetFlow", () => ({
  ...jest.requireActual("LLD/features/ModularDrawer/hooks/useOpenAssetFlow"),
  useOpenAssetFlow: jest.fn(),
}));

const getInitialState = (isOnboardingReceiveSuccess: boolean = false): Partial<State> => ({
  onboarding: {
    isOnboardingReceiveFlow: false,
    isOnboardingReceiveSuccess,
    onboardingSyncFlow: null,
  },
});

const mockHandleComplete = jest.fn();
const mockOpenAssetFlow = jest.fn();
const mockUseOpenAssetFlow = jest.fn().mockReturnValue({ openAssetFlow: mockOpenAssetFlow });

const newSeedConfiguration = "new_seed";

describe("NewSeedPanel", () => {
  beforeEach(() => {
    jest.mocked(track).mockReset();
    jest.mocked(UseOpenAssetFlow.useOpenAssetFlow).mockReset();
    mockHandleComplete.mockReset();
    mockOpenAssetFlow.mockReset();
    jest.spyOn(UseOpenAssetFlow, "useOpenAssetFlow").mockImplementation(mockUseOpenAssetFlow);
  });

  it("should open add account modal when secure my crypto step clicked", async () => {
    const initialState = getInitialState();

    const { user } = render(
      <NewSeedPanel handleComplete={mockHandleComplete} seedConfiguration={newSeedConfiguration} />,
      { initialState },
    );

    const secureMyCryptoButton = screen.getByText("Secure my crypto");

    expect(secureMyCryptoButton).toBeVisible();

    await user.click(secureMyCryptoButton);

    expect(track).toHaveBeenNthCalledWith(1, "button_clicked", {
      button: "Secure my crypto",
      flow: analyticsFlowName,
      seedConfiguration: newSeedConfiguration,
    });
    expect(mockOpenAssetFlow).toHaveBeenCalled();
  });

  it("should trigger completion when user finishes receive flow", async () => {
    const initialState = getInitialState(true);

    render(<NewSeedPanel handleComplete={mockHandleComplete} />, { initialState });

    expect(mockHandleComplete).toHaveBeenCalled();
  });

  it("should handle skip button click", async () => {
    const initialState = getInitialState();

    const { user } = render(
      <NewSeedPanel handleComplete={mockHandleComplete} seedConfiguration={newSeedConfiguration} />,
      { initialState },
    );

    const skipButton = screen.getByText("Maybe later");

    expect(skipButton).toBeVisible();

    await user.click(skipButton);

    expect(track).toHaveBeenNthCalledWith(1, "button_clicked", {
      button: "Maybe later",
      flow: analyticsFlowName,
      seedConfiguration: newSeedConfiguration,
    });

    expect(mockHandleComplete).toHaveBeenCalled();
  });
});
