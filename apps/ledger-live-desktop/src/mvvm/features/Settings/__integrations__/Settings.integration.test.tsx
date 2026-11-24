import React from "react";
import { Route, Routes, useLocation } from "react-router";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { SettingsRoute } from "LLD/features/Settings";

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

  it.each(["/settings/help", "/settings/experimental", "/settings/developer/info-state-qa"])(
    "keeps the legacy Settings for %s, not in the Settings page yet",
    route => {
      renderSettings(route, true);

      expect(screen.getByText("Legacy settings")).toBeVisible();
    },
  );
});
