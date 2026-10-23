import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
import type { ConfigSwitchState } from "../types";
import { AppConfig } from "./AppConfig";

const ledgerKeyRing: ConfigSwitchState = {
  id: "ledgerKeyRing",
  label: "Ledger Key Ring backends",
  options: [
    { id: "prod", values: { keycloakBaseUrl: "https://keycloak.example.com" } },
    { id: "staging", values: { keycloakBaseUrl: "https://keycloak.stg.example.com" } },
  ],
  currentOptionId: "prod",
  savedOptionId: undefined,
};

function renderAppConfig(switches: readonly ConfigSwitchState[] = [ledgerKeyRing]) {
  const onSelectOption = jest.fn();
  const onResetSwitch = jest.fn();
  const onReloadApp = jest.fn();
  render(
    <AppConfig
      defaultOptionId="prod"
      switches={switches}
      onSelectOption={onSelectOption}
      onResetSwitch={onResetSwitch}
      onReloadApp={onReloadApp}
    />,
  );
  return { onSelectOption, onResetSwitch, onReloadApp };
}

describe("AppConfig.web", () => {
  it("should list each switch with its options, current and default option", () => {
    renderAppConfig([{ ...ledgerKeyRing, currentOptionId: "staging", savedOptionId: "staging" }]);

    expect(screen.getByText("Ledger Key Ring backends")).toBeVisible();
    expect(screen.getByRole("radio", { name: "prod" })).toBeVisible();
    expect(screen.getByRole("radio", { name: "staging" })).toBeChecked();
    expect(screen.getByText("Current: staging")).toBeVisible();
    expect(screen.getByText("Default: prod")).toBeVisible();
    expect(screen.queryByText(/^Next:/)).toBeNull();
  });

  it("should show the values of the selected option", () => {
    renderAppConfig([{ ...ledgerKeyRing, savedOptionId: "staging" }]);

    expect(screen.getByText("https://keycloak.stg.example.com")).toBeVisible();
  });

  it("should let the switch id and the value names and values be selected", () => {
    renderAppConfig();

    // The desktop app turns text selection off on its body.
    expect(screen.getByText("ledgerKeyRing")).toHaveClass("select-text");
    expect(screen.getByText("keycloakBaseUrl").closest("dl")).toHaveClass("select-text");
  });

  it("should save a selected option", async () => {
    const { onSelectOption, onReloadApp } = renderAppConfig();

    await userEvent.click(screen.getByRole("radio", { name: "staging" }));

    expect(onSelectOption).toHaveBeenCalledWith("ledgerKeyRing", "staging");
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should show no footer until a saved option differs from the current one", () => {
    renderAppConfig();

    expect(screen.queryByRole("button", { name: "Reload" })).toBeNull();
    expect(screen.queryByText(/after a reload/)).toBeNull();
  });

  it("should mark a pending option and reload on demand", async () => {
    const { onReloadApp } = renderAppConfig([{ ...ledgerKeyRing, savedOptionId: "staging" }]);

    expect(screen.getByText("Next: staging")).toBeVisible();
    expect(screen.getByText("1 saved change applies after a reload.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Reload" }));

    expect(onReloadApp).toHaveBeenCalledTimes(1);
  });

  it("should reset a switch when its default option is selected, without reloading", async () => {
    const { onSelectOption, onResetSwitch, onReloadApp } = renderAppConfig([
      { ...ledgerKeyRing, savedOptionId: "staging" },
    ]);

    await userEvent.click(screen.getByRole("radio", { name: "prod" }));

    expect(onResetSwitch).toHaveBeenCalledWith("ledgerKeyRing");
    expect(onSelectOption).not.toHaveBeenCalled();
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should filter the switches with the search and the switched filter", async () => {
    renderAppConfig([
      ledgerKeyRing,
      { ...ledgerKeyRing, id: "explorers", label: "Block explorers", savedOptionId: "staging" },
    ]);
    const searchInput = screen.getByPlaceholderText("Search switches...");

    await userEvent.type(searchInput, "block");

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeVisible();

    await userEvent.clear(searchInput);
    await userEvent.click(screen.getByRole("radio", { name: "Switched" }));

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeVisible();
  });

  it("should say when no switch matches the search", async () => {
    renderAppConfig();

    await userEvent.type(screen.getByPlaceholderText("Search switches..."), "nothing");

    expect(screen.getByText("No switch matches.")).toBeVisible();
  });
});
