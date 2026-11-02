import { fireEvent, render, screen } from "@support/jest/devtools/native";
import { useState } from "react";
import type { ConfigOptionId, RejectedDevValue } from "@shared/app-config";
import type { ConfigFixedValueState, ConfigSwitchState } from "../types";
import { AppConfig } from "./AppConfig";

const prodUrl = "https://keycloak.example.com";
const stagingUrl = "https://keycloak.stg.example.com";

const keycloakBaseUrl = {
  name: "keycloakBaseUrl",
  currentValue: prodUrl,
  nextValue: prodUrl,
  baseValue: prodUrl,
  hasDevValue: false,
  rejectedDevValue: undefined,
};

const ledgerKeyRing: ConfigSwitchState = {
  id: "ledgerKeyRing",
  label: "Ledger Key Ring backends",
  currentSelectionId: "prod",
  savedSelectionId: undefined,
  values: [keycloakBaseUrl],
};

/** The switch of a staging-default build, on Dev with no dev value yet. */
const ledgerKeyRingOnDev: ConfigSwitchState = {
  ...ledgerKeyRing,
  currentSelectionId: "staging",
  savedSelectionId: "dev",
  values: [
    { ...keycloakBaseUrl, currentValue: stagingUrl, nextValue: stagingUrl, baseValue: stagingUrl },
  ],
};

const keycloakRealm: ConfigFixedValueState = {
  name: "keycloakRealm",
  currentValue: "ledger-bc-customers",
  nextValue: "ledger-bc-customers",
  baseValue: "ledger-bc-customers",
  hasDevValue: false,
  rejectedDevValue: undefined,
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
    const field = screen.getByLabelText("keycloakBaseUrl");
    expect(field).toHaveDisplayValue(stagingUrl);
    expect(field).toHaveProp("editable", false);
  });

  it("should let the switch id and the value names be selected", () => {
    renderAppConfig();

    expect(screen.getByText("ledgerKeyRing")).toHaveProp("selectable", true);
    expect(screen.getByText("keycloakBaseUrl")).toHaveProp("selectable", true);
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
    expect(screen.getByLabelText("keycloakRealm")).toHaveDisplayValue("ledger-bc-customers");
    expect(screen.getByLabelText("keycloakRealm")).toHaveProp("editable", false);
    expect(screen.queryByText("dev")).toBeNull();
  });

  describe("dev values", () => {
    it("should put a fixed value on Dev", () => {
      const { onSelect } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [],
        fixedValues: [keycloakRealm],
      });

      fireEvent.press(screen.getByText("dev"));

      expect(onSelect).toHaveBeenCalledWith("keycloakRealm", "dev");
    });

    it("should save a text typed on Dev once editing ends", () => {
      const { onSetDevValue } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [ledgerKeyRingOnDev],
      });
      const field = screen.getByLabelText("keycloakBaseUrl");

      expect(field).toHaveDisplayValue(stagingUrl);
      expect(field).toHaveProp("editable", true);

      fireEvent.changeText(field, "http://localhost:8080");
      expect(onSetDevValue).not.toHaveBeenCalled();
      fireEvent(field, "endEditing");

      expect(onSetDevValue).toHaveBeenCalledWith("keycloakBaseUrl", "http://localhost:8080");
    });

    it("should save a text typed on Dev before restarting, while its field is still focused", () => {
      const { onSetDevValue, onReloadApp } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [ledgerKeyRingOnDev],
      });

      fireEvent.changeText(screen.getByLabelText("keycloakBaseUrl"), "http://localhost:8080");
      fireEvent.press(screen.getByText("Restart"));

      expect(onSetDevValue).toHaveBeenCalledWith("keycloakBaseUrl", "http://localhost:8080");
      expect(onReloadApp).toHaveBeenCalledTimes(1);
      expect(onSetDevValue.mock.invocationCallOrder[0]).toBeLessThan(
        onReloadApp.mock.invocationCallOrder[0],
      );
    });

    it("should not restart when the host refuses the text typed on Dev", () => {
      const { onSetDevValue, onReloadApp } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [ledgerKeyRingOnDev],
      });
      onSetDevValue.mockReturnValue(false);

      fireEvent.changeText(screen.getByLabelText("keycloakBaseUrl"), "not a url");
      fireEvent.press(screen.getByText("Restart"));

      expect(onSetDevValue).toHaveBeenCalledWith("keycloakBaseUrl", "not a url");
      expect(onReloadApp).not.toHaveBeenCalled();
    });

    it("should not restart on a second try while the text typed on Dev is refused", () => {
      const onReloadApp = jest.fn();
      render(<RefusingHost onReloadApp={onReloadApp} />);

      fireEvent.changeText(screen.getByLabelText("keycloakBaseUrl"), "not a url");
      fireEvent.press(screen.getByText("Restart"));
      expect(screen.getByText("Invalid URL")).toBeOnTheScreen();
      fireEvent.press(screen.getByText("Restart"));

      expect(onReloadApp).not.toHaveBeenCalled();
      expect(screen.getByLabelText("keycloakBaseUrl")).toHaveDisplayValue("not a url");
    });

    it("should save a text typed on Dev before switching away, while its field is still focused", () => {
      const { onSetDevValue, onResetSelection } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [ledgerKeyRingOnDev],
      });

      fireEvent.changeText(screen.getByLabelText("keycloakBaseUrl"), "http://localhost:8080");
      fireEvent.press(screen.getByText("staging"));

      expect(onSetDevValue).toHaveBeenCalledWith("keycloakBaseUrl", "http://localhost:8080");
      expect(onSetDevValue.mock.invocationCallOrder[0]).toBeLessThan(
        onResetSelection.mock.invocationCallOrder[0],
      );
    });

    it("should show a refused dev value with why, and reset a saved one", () => {
      const { onRemoveDevValue } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [
          {
            ...ledgerKeyRingOnDev,
            values: [
              {
                ...ledgerKeyRingOnDev.values[0],
                hasDevValue: true,
                rejectedDevValue: { value: "not a url", message: "Invalid URL" },
              },
            ],
          },
        ],
      });

      expect(screen.getByLabelText("keycloakBaseUrl")).toHaveDisplayValue("not a url");
      expect(screen.getByText("Invalid URL")).toBeOnTheScreen();

      fireEvent.press(screen.getByLabelText("Reset"));

      expect(onRemoveDevValue).toHaveBeenCalledWith("keycloakBaseUrl");
    });
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
    onSetDevValue: jest.fn(() => true),
    onRemoveDevValue: jest.fn(),
    onReloadApp: jest.fn(),
  };
  render(<AppConfig session={{ defaultOptionId, switches, fixedValues }} {...callbacks} />);
  return callbacks;
}

/** A host that refuses every dev value with why, as the middleware refuses one that does not parse. */
function RefusingHost({ onReloadApp }: Readonly<{ onReloadApp: () => void }>) {
  const [rejectedDevValue, setRejectedDevValue] = useState<RejectedDevValue>();
  return (
    <AppConfig
      session={{
        defaultOptionId: "staging",
        switches: [
          {
            ...ledgerKeyRingOnDev,
            values: [{ ...ledgerKeyRingOnDev.values[0], rejectedDevValue }],
          },
        ],
        fixedValues: [],
      }}
      onSelect={jest.fn()}
      onResetSelection={jest.fn()}
      onSetDevValue={(_, value) => {
        setRejectedDevValue({ value, message: "Invalid URL" });
        return false;
      }}
      onRemoveDevValue={jest.fn()}
      onReloadApp={onReloadApp}
    />
  );
}
