import React from "react";
import { renderWithReactQuery, screen, withFlagOverrides } from "@tests/test-renderer";
import SettingsNavigator from "~/components/RootNavigator/SettingsNavigator";
import { activateDrawerSelector } from "~/reducers/walletSync";

jest.mock("@react-native-firebase/app", () => ({
  getApp: () => ({ options: { projectId: "ledger-live-staging" } }),
}));

async function renderGeneral({ isLedgerSyncEnabled = true } = {}) {
  const flags = { newSettings: { enabled: true }, llmWalletSync: { enabled: isLedgerSyncEnabled } };
  const view = renderWithReactQuery(<SettingsNavigator />, {
    overrideInitialState: withFlagOverrides(flags, state => ({
      ...state,
      appLock: { ...state.appLock, isHydrated: true },
    })),
  });
  await view.user.press(await screen.findByTestId("settings-home-general"));
  await screen.findByTestId("settings-general");
  return view;
}

describe("Settings General (mobile)", () => {
  it("shows the General rows with their current values", async () => {
    await renderGeneral();

    for (const row of ["ledgerSync", "theme", "language", "dateFormat", "currency"]) {
      expect(screen.getByTestId(`settings-general-${row}`)).toBeVisible();
    }
    expect(screen.getByText("English")).toBeVisible();
  });

  it("hides Ledger Sync while llmWalletSync is off, and keeps the other rows", async () => {
    await renderGeneral({ isLedgerSyncEnabled: false });

    expect(screen.queryByTestId("settings-general-ledgerSync")).toBeNull();
    for (const row of ["theme", "language", "currency"]) {
      expect(screen.getByTestId(`settings-general-${row}`)).toBeVisible();
    }
  });

  it("opens the Ledger Sync activation drawer while Ledger Sync is off", async () => {
    const { user, store } = await renderGeneral();

    await user.press(screen.getByTestId("settings-general-ledgerSync"));

    expect(activateDrawerSelector(store.getState())).toBe(true);
  });

  it("stores the theme picked in the theme sheet", async () => {
    const { user, store } = await renderGeneral();

    await user.press(screen.getByTestId("settings-general-theme"));
    await user.press(await screen.findByText("Light"));

    expect(store.getState().settings.theme).toBe("light");
  });

  it("stores the date format picked in its sheet", async () => {
    const { user, store } = await renderGeneral();

    await user.press(screen.getByTestId("settings-general-dateFormat"));
    await user.press(await screen.findByText("DD/MM/YYYY"));

    expect(store.getState().settings.dateFormat).toBe("DD/MM/YYYY");
  });
});
