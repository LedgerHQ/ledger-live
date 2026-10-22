import { fireEvent, render, screen } from "@support/jest/devtools/native";
import type { ConfigOptionId } from "@shared/app-config";
import type { ConfigFixedValueState, ConfigSwitchState } from "../types";
import { AppConfig } from "./AppConfig";

const prodUrl = "https://keycloak.example.com";
const stagingUrl = "https://keycloak.stg.example.com";

const keycloakBaseUrl = {
  name: "keycloakBaseUrl",
  currentValue: prodUrl,
  nextValue: prodUrl,
};

const ledgerKeyRing: ConfigSwitchState = {
  id: "ledgerKeyRing",
  label: "Ledger Key Ring backends",
  currentSelectionId: "prod",
  savedSelectionId: undefined,
  values: [keycloakBaseUrl],
};

const keycloakRealm: ConfigFixedValueState = {
  name: "keycloakRealm",
  currentValue: "ledger-bc-customers",
  nextValue: "ledger-bc-customers",
  isDevCurrent: false,
  isDevSaved: false,
};

describe("AppConfig (native)", () => {
  it("should list each switch with its options, current and default option", () => {
    renderAppConfig({
      switches: [
        {
          ...ledgerKeyRing,
          currentSelectionId: "staging",
          savedSelectionId: "staging",
          values: [{ ...keycloakBaseUrl, currentValue: stagingUrl, nextValue: stagingUrl }],
        },
      ],
    });

    expect(screen.getByText("Ledger Key Ring backends")).toBeOnTheScreen();
    expect(screen.getByText("prod")).toBeOnTheScreen();
    expect(screen.getByText("staging")).toBeOnTheScreen();
    expect(screen.getByText("Current: staging")).toBeOnTheScreen();
    expect(screen.getByText("Default: prod")).toBeOnTheScreen();
    expect(screen.getByText(stagingUrl)).toBeOnTheScreen();
  });

  it("should let the switch id and the value names and values be selected", () => {
    renderAppConfig();

    expect(screen.getByText("ledgerKeyRing")).toHaveProp("selectable", true);
    expect(screen.getByText("keycloakBaseUrl")).toHaveProp("selectable", true);
    expect(screen.getByText(prodUrl)).toHaveProp("selectable", true);
  });

  it("should save a selected option without restarting", () => {
    const { onSelect, onReloadApp } = renderAppConfig();

    fireEvent.press(screen.getByText("staging"));

    expect(onSelect).toHaveBeenCalledWith("ledgerKeyRing", "staging");
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should show no footer when nothing is pending", () => {
    renderAppConfig();

    expect(screen.queryByText("Restart")).toBeNull();
    expect(screen.queryByText(/after a restart/)).toBeNull();
  });

  it("should mark a pending option and restart on demand", () => {
    const { onReloadApp } = renderAppConfig({
      switches: [{ ...ledgerKeyRing, savedSelectionId: "staging" }],
    });

    expect(screen.getByText("Next: staging")).toBeOnTheScreen();
    expect(screen.getByText("1 saved change applies after a restart.")).toBeOnTheScreen();

    fireEvent.press(screen.getByText("Restart"));

    expect(onReloadApp).toHaveBeenCalledTimes(1);
  });

  it("should reset a switch when its default option is selected, without restarting", () => {
    const { onSelect, onResetSelection, onReloadApp } = renderAppConfig({
      switches: [{ ...ledgerKeyRing, savedSelectionId: "staging" }],
    });

    fireEvent.press(screen.getByText("prod"));

    expect(onResetSelection).toHaveBeenCalledWith("ledgerKeyRing");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should filter the rows with the search and the switched filter", () => {
    renderAppConfig({
      switches: [
        ledgerKeyRing,
        {
          ...ledgerKeyRing,
          id: "explorers",
          label: "Block explorers",
          savedSelectionId: "staging",
        },
      ],
    });
    const searchInput = screen.getByPlaceholderText("Search config...");

    fireEvent.changeText(searchInput, "block");

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeOnTheScreen();

    fireEvent.changeText(searchInput, "");
    fireEvent.press(screen.getByText("Switched"));

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeOnTheScreen();
  });

  it("should list the fixed values, without Dev when the default is prod", () => {
    renderAppConfig({ fixedValues: [keycloakRealm] });

    expect(screen.getByText("Fixed values")).toBeOnTheScreen();
    expect(screen.getByText("keycloakRealm")).toBeOnTheScreen();
    expect(screen.getByText("ledger-bc-customers")).toBeOnTheScreen();
    expect(screen.queryByText("dev")).toBeNull();
  });
});

function renderAppConfig({
  switches = [ledgerKeyRing],
  fixedValues = [],
  defaultOptionId = "prod",
}: {
  switches?: readonly ConfigSwitchState[];
  fixedValues?: readonly ConfigFixedValueState[];
  defaultOptionId?: ConfigOptionId;
} = {}) {
  const callbacks = {
    onSelect: jest.fn(),
    onResetSelection: jest.fn(),
    onReloadApp: jest.fn(),
  };
  render(<AppConfig session={{ defaultOptionId, switches, fixedValues }} {...callbacks} />);
  return callbacks;
}
