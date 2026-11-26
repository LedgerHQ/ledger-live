import React from "react";
import { Route, Routes, useLocation } from "react-router";
import { act, render, screen, withFlagOverrides } from "tests/testSetup";
import { SettingsRoute } from "LLD/features/Settings";
import { setHasPassword } from "~/renderer/actions/application";
import { setDiscreetMode, setMevProtection } from "~/renderer/actions/settings";
import { isModalOpened } from "~/renderer/reducers/modals";
import {
  autoLockTimeoutSelector,
  discreetModeSelector,
  mevProtectionSelector,
} from "~/renderer/reducers/settings";

jest.mock("~/renderer/linking", () => ({ openURL: jest.fn() }));

const SECTION_IDS = ["general", "assetManagement", "security", "privacy", "about"];

function LocationProbe() {
  const { pathname } = useLocation();
  return <span data-testid="location">{pathname}</span>;
}

function renderSettings(initialRoute: string, isFlagEnabled: boolean) {
  return render(
    <>
      <Routes>
        <Route
          path="/settings/*"
          element={<SettingsRoute legacySettings={<span>Legacy settings</span>} />}
        />
      </Routes>
      <LocationProbe />
    </>,
    {
      initialRoute,
      initialState: withFlagOverrides({ newSettings: { enabled: isFlagEnabled } }),
    },
  );
}

function expectSelectedTab(selectedId: string) {
  for (const id of SECTION_IDS) {
    expect(screen.getByTestId(`settings-tab-${id}`)).toHaveAttribute(
      "aria-checked",
      String(id === selectedId),
    );
  }
}

describe("SettingsRoute", () => {
  it("keeps the legacy Settings when the flag is off", () => {
    renderSettings("/settings", false);

    expect(screen.getByText("Legacy settings")).toBeVisible();
    expect(screen.queryByTestId("settings-page")).not.toBeInTheDocument();
  });

  it("opens the Settings page on General when the flag is on", () => {
    renderSettings("/settings", true);

    expect(screen.getByTestId("settings-page")).toBeVisible();
    expect(screen.queryByText("Legacy settings")).not.toBeInTheDocument();
    for (const id of SECTION_IDS) {
      expect(screen.getByTestId(`settings-tab-${id}`)).toBeVisible();
    }
    expectSelectedTab("general");
  });

  it("selects the section given in the address", () => {
    renderSettings("/settings/security", true);

    expect(screen.getByTestId("location")).toHaveTextContent("/settings/security");
    expectSelectedTab("security");
  });

  it("selects General for an unknown section", () => {
    renderSettings("/settings/unknown", true);

    expectSelectedTab("general");
  });

  it("changes the address and the selected tab when the user picks another section", async () => {
    const { user } = renderSettings("/settings", true);

    await user.click(screen.getByTestId("settings-tab-privacy"));

    expect(screen.getByTestId("location")).toHaveTextContent("/settings/privacy");
    expectSelectedTab("privacy");
  });

  it.each(["/settings/experimental", "/settings/developer/info-state-qa"])(
    "keeps the legacy Settings for %s, not in the Settings page yet",
    route => {
      renderSettings(route, true);

      expect(screen.getByText("Legacy settings")).toBeVisible();
    },
  );
});

describe("SettingsRoute, Help page", () => {
  it("shows the Help page at /settings/help when the flag is on", () => {
    renderSettings("/settings/help", true);

    expect(screen.getByTestId("settings-help")).toBeVisible();
    expect(screen.getByText("Ledger support")).toBeVisible();
    expect(screen.getByText("Reset Ledger Wallet")).toBeVisible();
    expect(screen.queryByTestId("settings-page")).not.toBeInTheDocument();
    expect(screen.queryByText("Legacy settings")).not.toBeInTheDocument();
  });

  it("keeps the legacy Settings on the Help address when the flag is off", () => {
    renderSettings("/settings/help", false);

    expect(screen.getByText("Legacy settings")).toBeVisible();
    expect(screen.queryByTestId("settings-help")).not.toBeInTheDocument();
  });

  it("asks for a confirmation before clearing the cache", async () => {
    const { user } = renderSettings("/settings/help", true);

    await user.click(screen.getByTestId("settings-help-clearCache-button"));

    expect(screen.getByTestId("settings-help-confirm-button")).toBeVisible();
  });

  it("asks for a confirmation before resetting Ledger Wallet", async () => {
    const { user } = renderSettings("/settings/help", true);

    await user.click(screen.getByTestId("settings-help-resetApp-button"));

    expect(screen.getByTestId("settings-help-confirm-button")).toBeVisible();
    expect(screen.getByTestId("settings-help-cancel-button")).toBeVisible();
  });
});

describe("SettingsRoute, Security section", () => {
  it("shows hide balance, App lock and MEV protection", () => {
    renderSettings("/settings/security", true);

    expect(screen.getByTestId("settings-security")).toBeVisible();
    expect(screen.getByText("Hide balance")).toBeVisible();
    expect(screen.getByText("App lock")).toBeVisible();
    expect(screen.getByText("MEV protection")).toBeVisible();
    expect(screen.queryByText("Auto-lock")).not.toBeInTheDocument();
  });

  it("keeps the legacy Settings on the Security address when the flag is off", () => {
    renderSettings("/settings/security", false);

    expect(screen.getByText("Legacy settings")).toBeVisible();
    expect(screen.queryByTestId("settings-security")).not.toBeInTheDocument();
  });

  it("changes MEV protection in the app store, where the legacy screen reads it", async () => {
    const { user, store } = renderSettings("/settings/security", true);
    expect(mevProtectionSelector(store.getState())).toBe(true);

    await user.click(screen.getByTestId("setting-mevProtection-toggle"));

    expect(mevProtectionSelector(store.getState())).toBe(false);
  });

  it("changes hide balance in the app store, where the discreet mode reads it", async () => {
    const { user, store } = renderSettings("/settings/security", true);

    await user.click(screen.getByTestId("setting-hideBalance-toggle"));

    expect(discreetModeSelector(store.getState())).toBe(true);
  });

  it("shows a change made elsewhere in the app", () => {
    const { store } = renderSettings("/settings/security", true);

    act(() => {
      store.dispatch(setDiscreetMode(true));
      store.dispatch(setMevProtection(false));
    });

    expect(screen.getByTestId("setting-hideBalance-toggle")).toBeChecked();
    expect(screen.getByTestId("setting-mevProtection-toggle")).not.toBeChecked();
  });

  it("opens the legacy password modal from the App lock toggle", async () => {
    const { user, store } = renderSettings("/settings/security", true);

    await user.click(screen.getByTestId("setting-appLock-toggle"));

    expect(isModalOpened(store.getState(), "MODAL_PASSWORD")).toBe(true);
  });

  it("shows Auto-lock and Change password once a password is set, and the modal to remove it", async () => {
    const { user, store } = renderSettings("/settings/security", true);

    act(() => {
      store.dispatch(setHasPassword(true));
    });

    expect(screen.getByText("Auto-lock")).toBeVisible();
    expect(screen.getByRole("button", { name: "Change" })).toBeVisible();
    expect(autoLockTimeoutSelector(store.getState())).toBe(10);
    await user.click(screen.getByTestId("setting-appLock-toggle"));
    expect(isModalOpened(store.getState(), "MODAL_DISABLE_PASSWORD")).toBe(true);
  });
});
