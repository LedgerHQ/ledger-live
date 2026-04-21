import { useAccountPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { track } from "~/renderer/analytics/segment";
import { ActionsList } from "..";
import ContextMenuContext from "../../ContextMenuContext";

const HELP_LABEL = "Help";
const RECOVER_LABEL = "[L] Recover";
const REFER_LABEL = "Referral";
const MY_WALLET_ROUTE = "/my-wallet";
const RECOVER_HOME_PATH = "/recover";
const REFER_PATH = "/refer-a-friend";

const mockNavigate = jest.fn();
const mockClose = jest.fn();

jest.mock("@ledgerhq/live-common/hooks/recoverFeatureFlag", () => ({
  useAccountPath: jest.fn(),
}));

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: () => mockNavigate,
}));

const mockUseAccountPath = jest.mocked(useAccountPath);
const mockTrack = jest.mocked(track);
const renderActionsList = (options?: Parameters<typeof render>[1]) =>
  render(
    <ContextMenuContext.Provider value={{ close: mockClose }}>
      <ActionsList />
    </ContextMenuContext.Provider>,
    options,
  );
const getButton = (name: string) => screen.getByRole("button", { name });

describe("ActionsList", () => {
  beforeEach(() => {
    mockUseAccountPath.mockReturnValue(undefined);
  });
  afterAll(() => {
    jest.clearAllMocks();
  });

  it("shows only help by default", () => {
    renderActionsList();

    expect(screen.getByTestId("my-wallet-actions-list")).toBeVisible();
    expect(getButton(HELP_LABEL)).toBeVisible();
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

    expect(getButton(RECOVER_LABEL)).toBeVisible();
  });

  it("navigates to help settings and tracks the click", async () => {
    const { user } = renderActionsList({ initialRoute: MY_WALLET_ROUTE });

    await user.click(getButton(HELP_LABEL));

    expect(mockNavigate).toHaveBeenCalledWith("/settings/help");
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Help",
      page: MY_WALLET_ROUTE,
      entry: "my_wallet_actions_list",
    });
  });

  it("navigates to the recover home and tracks the click", async () => {
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

    await user.click(getButton(RECOVER_LABEL));

    expect(mockNavigate).toHaveBeenCalledWith(RECOVER_HOME_PATH);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
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

    await user.click(getButton(RECOVER_LABEL));

    expect(store.getState().settings.hasClickedRecover).toBe(true);
  });

  it("shows refer when the feature is enabled", () => {
    renderActionsList({
      initialState: withFlagOverrides({
        referralProgramDesktopSidebar: {
          enabled: true,
          params: { path: REFER_PATH },
        },
      }),
    });

    expect(getButton(REFER_LABEL)).toBeVisible();
  });

  it("navigates to the refer path and tracks the click", async () => {
    const { user } = renderActionsList({
      initialRoute: MY_WALLET_ROUTE,
      initialState: withFlagOverrides({
        referralProgramDesktopSidebar: {
          enabled: true,
          params: { path: REFER_PATH },
        },
      }),
    });

    await user.click(getButton(REFER_LABEL));

    expect(mockNavigate).toHaveBeenCalledWith(REFER_PATH);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Refer",
      page: MY_WALLET_ROUTE,
      entry: "my_wallet_actions_list",
    });
  });
});
