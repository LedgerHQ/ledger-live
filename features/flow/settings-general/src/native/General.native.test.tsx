import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import { matchesSettingsOption } from "@features/flow-settings";
import { makeSettingsWrapper } from "../__tests__/settingsWrapper";
import { createFakeGeneralPort } from "../__tests__/fakeGeneralPort";
import { General } from "./General";

function renderSection(...args: Parameters<typeof createFakeGeneralPort>) {
  const fake = createFakeGeneralPort(...args);
  render(<General testID="settings-general" />, { wrapper: makeSettingsWrapper(fake.port) });
  return fake;
}

describe("General (native)", () => {
  it("shows each row with its current value", () => {
    renderSection({ theme: "dark", language: "fr", currency: "EUR", dateFormat: "MM/DD/YYYY" });

    expect(screen.getByText("Ledger Sync")).toBeVisible();
    expect(screen.getByText("Dark")).toBeVisible();
    expect(screen.getByText("Français")).toBeVisible();
    expect(screen.getByText("Date format")).toBeVisible();
    expect(screen.getByText("MM/DD/YYYY")).toBeVisible();
    expect(screen.getByText("EUR")).toBeVisible();
  });

  it("opens the sheet of the pressed row and closes it", async () => {
    const user = userEvent.setup();
    renderSection();
    const sheet = () => screen.getByTestId("settings-general-sheet");
    expect(sheet()).toHaveProp("accessibilityState", { expanded: false });

    await user.press(screen.getByTestId("settings-general-theme"));

    expect(sheet()).toHaveProp("accessibilityState", { expanded: true });

    await user.press(screen.getByTestId("settings-general-sheet-dismiss"));
    expect(sheet()).toHaveProp("accessibilityState", { expanded: false });
  });

  it("searches the currencies by name, ticker or value", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.press(screen.getByTestId("settings-general-currency"));

    expect(screen.UNSAFE_getByProps({ filter: matchesSettingsOption })).toBeTruthy();
  });

  it("keeps the sheet content while it closes", async () => {
    const user = userEvent.setup();
    renderSection();

    await user.press(screen.getByTestId("settings-general-theme"));
    await user.press(screen.getByTestId("settings-general-sheet-dismiss"));

    expect(screen.getByTestId("settings-general-sheet")).toHaveProp("accessibilityState", {
      expanded: false,
    });
    expect(screen.UNSAFE_getByProps({ title: "Select theme" })).toBeTruthy();
  });

  it("opens Ledger Sync", async () => {
    const user = userEvent.setup();
    const { ledgerSyncOpenings } = renderSection();

    await user.press(screen.getByTestId("settings-general-ledgerSync"));

    expect(ledgerSyncOpenings.count).toBe(1);
  });
});
