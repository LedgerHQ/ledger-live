import React from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { makeSettingsWrapper } from "../__tests__/settingsWrapper";
import { createFakeGeneralPort } from "../__tests__/fakeGeneralPort";
import { General } from "./General";

function renderSection(...args: Parameters<typeof createFakeGeneralPort>) {
  const fake = createFakeGeneralPort(...args);
  render(<General testID="settings-general" />, { wrapper: makeSettingsWrapper(fake.port) });
  return fake;
}

describe("General", () => {
  it("shows the five General rows", () => {
    renderSection();

    for (const title of ["Ledger Sync", "Theme", "Language", "Region", "Currency"]) {
      expect(screen.getByText(title)).toBeVisible();
    }
  });

  it("opens Ledger Sync", async () => {
    const user = userEvent.setup();
    const { ledgerSyncOpenings } = renderSection();

    await user.click(screen.getByRole("button", { name: "Sync" }));

    expect(ledgerSyncOpenings.count).toBe(1);
  });

  it("picks a region in the region dialog", async () => {
    const user = userEvent.setup();
    const { updates } = renderSection({ region: "en-US" });

    await user.click(screen.getByRole("button", { name: /^Region, / }));
    expect(screen.getByText("Select your region")).toBeVisible();
    expect(screen.getByTestId("settings-general-region-en-US")).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByTestId("settings-general-region-fr-FR")).not.toHaveAttribute("aria-current");

    await user.type(
      within(screen.getByTestId("settings-general-region-picker")).getByPlaceholderText("Search"),
      "France",
    );
    await user.click(screen.getByTestId("settings-general-region-fr-FR"));

    expect(updates).toEqual([{ key: "region", value: "fr-FR" }]);
  });

  it("says when no region matches the search", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole("button", { name: /^Region, / }));
    await user.type(
      within(screen.getByTestId("settings-general-region-picker")).getByPlaceholderText("Search"),
      "zzzz",
    );

    expect(screen.getByText("No results")).toBeVisible();
  });
});
