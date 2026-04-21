import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import * as segment from "~/renderer/analytics/segment";
import { ActionsList } from "..";

const HELP_LABEL = "Help";
const RECOVER_LABEL = "Recover";
const MY_WALLET_ROUTE = "/my-wallet";
const RECOVER_HOME_PATH = "/recover";

const mockNavigate = jest.fn();

jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useAccountPath: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const mockUseAccountPath = jest.mocked(useAccountPath);
const renderActionsList = (options?: Parameters<typeof render>[1]) =>
  render(<ActionsList />, options);
const getHelpButton = () => screen.getByRole("button", { name: HELP_LABEL });
const getRecoverButton = () => screen.getByRole("button", { name: RECOVER_LABEL });
const queryRecoverButton = () => screen.queryByRole("button", { name: RECOVER_LABEL });

describe("ActionsList", () => {
  beforeEach(() => {
    mockUseAccountPath.mockReturnValue(undefined);
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  it("shows help and hides recover by default", () => {
    renderActionsList();

    expect(screen.getByTestId("my-wallet-actions-list")).toBeVisible();
    expect(getHelpButton()).toBeVisible();
    expect(queryRecoverButton()).not.toBeInTheDocument();
  });

  it("shows recover when the feature is enabled", () => {
    renderActionsList({
      initialState: withFlagOverrides({
        protectServicesDesktop: {
          enabled: true,
          params: { protectId: "protect-id" },
        },
      }),
    });

    expect(getRecoverButton()).toBeVisible();
  });

  it("navigates to help settings and tracks the click", async () => {
    const trackSpy = jest.spyOn(segment, "track");
    const { user } = renderActionsList({ initialRoute: MY_WALLET_ROUTE });

    await user.click(getHelpButton());

    expect(mockNavigate).toHaveBeenCalledWith("/settings/help");
    expect(trackSpy).toHaveBeenCalledWith("button_clicked", {
      button: "Help",
      page: MY_WALLET_ROUTE,
      entry: "my_wallet_actions_list",
    });
  });

  it("navigates to the recover home and tracks the click", async () => {
    const trackSpy = jest.spyOn(segment, "track");
    mockUseAccountPath.mockReturnValue(RECOVER_HOME_PATH);

    const { user } = renderActionsList({
      initialRoute: MY_WALLET_ROUTE,
      initialState: withFlagOverrides({
        protectServicesDesktop: {
          enabled: true,
          params: {
            openRecoverFromSidebar: true,
            protectId: "protect-id",
          },
        },
      }),
    });

    await user.click(getRecoverButton());

    expect(mockNavigate).toHaveBeenCalledWith(RECOVER_HOME_PATH);
    expect(trackSpy).toHaveBeenCalledWith("button_clicked", {
      button: "Recover",
      page: MY_WALLET_ROUTE,
      entry: "my_wallet_actions_list",
    });
  });

  it("persists hasClickedRecover in the store after the first recover click", async () => {
    mockUseAccountPath.mockReturnValue(RECOVER_HOME_PATH);

    const { user, store } = renderActionsList({
      initialRoute: MY_WALLET_ROUTE,
      initialState: withFlagOverrides({
        protectServicesDesktop: {
          enabled: true,
          params: {
            openRecoverFromSidebar: true,
            protectId: "protect-id",
          },
        },
      }),
    });

    expect(store.getState().settings.hasClickedRecover).toBe(false);

    await user.click(getRecoverButton());

    expect(store.getState().settings.hasClickedRecover).toBe(true);
  });
});
