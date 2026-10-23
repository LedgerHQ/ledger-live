import { fireEvent, render, screen } from "@support/jest/devtools/native";
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

describe("AppConfig (native)", () => {
  it("should list each switch with its options, current and default option", () => {
    renderAppConfig([{ ...ledgerKeyRing, currentOptionId: "staging", savedOptionId: "staging" }]);

    expect(screen.getByText("Ledger Key Ring backends")).toBeOnTheScreen();
    expect(screen.getByText("prod")).toBeOnTheScreen();
    expect(screen.getByText("staging")).toBeOnTheScreen();
    expect(screen.getByText("Current: staging")).toBeOnTheScreen();
    expect(screen.getByText("Default: prod")).toBeOnTheScreen();
    expect(screen.getByText("https://keycloak.stg.example.com")).toBeOnTheScreen();
  });

  it("should let the switch id and the value names and values be selected", () => {
    renderAppConfig();

    expect(screen.getByText("ledgerKeyRing")).toHaveProp("selectable", true);
    expect(screen.getByText("keycloakBaseUrl")).toHaveProp("selectable", true);
    expect(screen.getByText("https://keycloak.example.com")).toHaveProp("selectable", true);
  });

  it("should save a selected option without restarting", () => {
    const { onSelectOption, onReloadApp } = renderAppConfig();

    fireEvent.press(screen.getByText("staging"));

    expect(onSelectOption).toHaveBeenCalledWith("ledgerKeyRing", "staging");
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should show no footer when nothing is pending", () => {
    renderAppConfig();

    expect(screen.queryByText("Restart")).toBeNull();
    expect(screen.queryByText(/after a restart/)).toBeNull();
  });

  it("should mark a pending option and restart on demand", () => {
    const { onReloadApp } = renderAppConfig([{ ...ledgerKeyRing, savedOptionId: "staging" }]);

    expect(screen.getByText("Next: staging")).toBeOnTheScreen();
    expect(screen.getByText("1 saved change applies after a restart.")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Restart"));

    expect(onReloadApp).toHaveBeenCalledTimes(1);
  });

  it("should reset a switch when its default option is selected, without restarting", () => {
    const { onSelectOption, onResetSwitch, onReloadApp } = renderAppConfig([
      { ...ledgerKeyRing, savedOptionId: "staging" },
    ]);

    fireEvent.press(screen.getByText("prod"));

    expect(onResetSwitch).toHaveBeenCalledWith("ledgerKeyRing");
    expect(onSelectOption).not.toHaveBeenCalled();
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should filter the switches with the search and the switched filter", () => {
    renderAppConfig([
      ledgerKeyRing,
      { ...ledgerKeyRing, id: "explorers", label: "Block explorers", savedOptionId: "staging" },
    ]);
    const searchInput = screen.getByPlaceholderText("Search switches...");

    fireEvent.changeText(searchInput, "block");

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeOnTheScreen();

    fireEvent.changeText(searchInput, "");
    fireEvent.press(screen.getByText("Switched"));

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeOnTheScreen();
  });
});
