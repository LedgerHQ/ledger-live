import React from "react";
import { Route, Routes, useLocation } from "react-router";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { NewSettingsRoute } from "LLD/features/NewSettings";

function LocationProbe() {
  const { pathname } = useLocation();
  return <span data-testid="location">{pathname}</span>;
}

function renderSettings(initialRoute: string, newSettingsEnabled: boolean) {
  return render(
    <>
      <Routes>
        <Route
          path="/settings/*"
          element={<NewSettingsRoute legacySettings={<span>Legacy settings</span>} />}
        />
      </Routes>
      <LocationProbe />
    </>,
    {
      initialRoute,
      initialState: withFlagOverrides({ newSettings: { enabled: newSettingsEnabled } }),
    },
  );
}

describe("NewSettingsRoute", () => {
  it("keeps the legacy Settings when newSettings is off", () => {
    renderSettings("/settings", false);

    expect(screen.getByText("Legacy settings")).toBeInTheDocument();
    expect(screen.queryByTestId("new-settings-page")).not.toBeInTheDocument();
  });

  it("opens the new Settings on General when newSettings is on", () => {
    renderSettings("/settings", true);

    expect(screen.getByTestId("new-settings-page")).toBeInTheDocument();
    expect(screen.queryByText("Legacy settings")).not.toBeInTheDocument();
    for (const id of ["general", "assetManagement", "security", "privacy", "about"]) {
      expect(screen.getByTestId(`settings-tab-${id}`)).toBeInTheDocument();
    }
  });

  it("opens the section given in the address", () => {
    renderSettings("/settings/security", true);

    expect(screen.getByTestId("new-settings-page")).toBeInTheDocument();
    expect(screen.getByTestId("location")).toHaveTextContent("/settings/security");
  });

  it("changes the address when the user picks another section", async () => {
    const { user } = renderSettings("/settings", true);

    await user.click(screen.getByTestId("settings-tab-privacy"));

    expect(screen.getByTestId("location")).toHaveTextContent("/settings/privacy");
  });

  it.each(["/settings/help", "/settings/experimental", "/settings/developer/info-state-qa"])(
    "keeps the legacy Settings for %s, not in the new Settings yet",
    route => {
      renderSettings(route, true);

      expect(screen.getByText("Legacy settings")).toBeInTheDocument();
    },
  );
});
