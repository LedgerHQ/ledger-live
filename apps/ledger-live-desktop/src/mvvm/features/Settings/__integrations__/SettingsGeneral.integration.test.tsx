import React from "react";
import { Route, Routes } from "react-router";
import { render, screen, within, withFlagOverrides } from "tests/testSetup";
import { SettingsRoute } from "LLD/features/Settings";
import { walletSyncDrawerVisibilitySelector } from "~/renderer/reducers/walletSync";

function renderGeneral() {
  return render(
    <Routes>
      <Route
        path="/settings/*"
        element={<SettingsRoute legacySettings={<span>Legacy settings</span>} />}
      />
    </Routes>,
    {
      initialRoute: "/settings/general",
      initialState: withFlagOverrides({ newSettings: { enabled: true } }),
    },
  );
}

describe("Settings General", () => {
  it("shows the five General rows", () => {
    renderGeneral();

    for (const row of ["ledgerSync", "theme", "language", "region", "currency"]) {
      expect(screen.getByTestId(`settings-general-${row}`)).toBeVisible();
    }
  });

  it("opens the Ledger Sync drawer", async () => {
    const { user, store } = renderGeneral();

    await user.click(within(screen.getByTestId("settings-general-ledgerSync")).getByRole("button"));

    expect(walletSyncDrawerVisibilitySelector(store.getState())).toBe(true);
  });

  it("stores the region picked in the region dialog", async () => {
    const { user, store } = renderGeneral();

    await user.click(screen.getByRole("button", { name: /^Region, / }));
    const picker = screen.getByTestId("settings-general-region-picker");
    await user.type(within(picker).getByPlaceholderText("Search"), "France");
    await user.click(within(picker).getByTestId("settings-general-region-fr-FR"));

    expect(store.getState().settings.locale).toBe("fr-FR");
  });

  it("stores the theme picked in the theme select", async () => {
    const { user, store } = renderGeneral();

    await user.click(screen.getByRole("combobox", { name: "Theme" }));
    await user.click(await screen.findByRole("option", { name: "Dark" }));

    expect(store.getState().settings.theme).toBe("dark");
  });
});
