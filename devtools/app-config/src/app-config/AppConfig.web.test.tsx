import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
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

describe("AppConfig.web", () => {
  it("should list each switch with its options, current and default option", () => {
    renderAppConfig({
      switches: [{ ...ledgerKeyRing, currentSelectionId: "staging", savedSelectionId: "staging" }],
    });

    expect(screen.getByText("Ledger Key Ring backends")).toBeVisible();
    expect(screen.getByRole("radio", { name: "prod" })).toBeVisible();
    expect(screen.getByRole("radio", { name: "staging" })).toBeChecked();
    expect(screen.getByText("Current: staging")).toBeVisible();
    expect(screen.getByText("Default: prod")).toBeVisible();
    expect(screen.queryByText(/^Next:/)).toBeNull();
  });

  it("should show the values the next session runs on in read-only fields", () => {
    renderAppConfig({
      switches: [
        {
          ...ledgerKeyRing,
          savedSelectionId: "staging",
          values: [{ ...keycloakBaseUrl, nextValue: stagingUrl }],
        },
      ],
    });

    const field = screen.getByRole("textbox", { name: "keycloakBaseUrl" });
    expect(field).toHaveValue(stagingUrl);
    expect(field).toHaveAttribute("readonly");
  });

  it("should let the switch id and the value names and values be selected", () => {
    renderAppConfig();

    // The desktop app turns text selection off on its body.
    expect(screen.getByText("ledgerKeyRing")).toHaveClass("select-text");
    expect(screen.getByText("keycloakBaseUrl").closest("dl")).toHaveClass("select-text");
  });

  it("should save a selected option", async () => {
    const { onSelect, onReloadApp } = renderAppConfig();

    await userEvent.click(screen.getByRole("radio", { name: "staging" }));

    expect(onSelect).toHaveBeenCalledWith("ledgerKeyRing", "staging");
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should show no footer until a saved option differs from the current one", () => {
    renderAppConfig();

    expect(screen.queryByRole("button", { name: "Reload" })).toBeNull();
    expect(screen.queryByText(/after a reload/)).toBeNull();
  });

  it("should mark a pending option and reload on demand", async () => {
    const { onReloadApp } = renderAppConfig({
      switches: [{ ...ledgerKeyRing, savedSelectionId: "staging" }],
    });

    expect(screen.getByText("Next: staging")).toBeVisible();
    expect(screen.getByText("1 saved change applies after a reload.")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Reload" }));

    expect(onReloadApp).toHaveBeenCalledTimes(1);
  });

  it("should reset a switch when its default option is selected, without reloading", async () => {
    const { onSelect, onResetSelection, onReloadApp } = renderAppConfig({
      switches: [{ ...ledgerKeyRing, savedSelectionId: "staging" }],
    });

    await userEvent.click(screen.getByRole("radio", { name: "prod" }));

    expect(onResetSelection).toHaveBeenCalledWith("ledgerKeyRing");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onReloadApp).not.toHaveBeenCalled();
  });

  it("should filter the rows with the search and the switched filter", async () => {
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

    await userEvent.type(searchInput, "block");

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeVisible();

    await userEvent.clear(searchInput);
    await userEvent.click(screen.getByRole("radio", { name: "Switched" }));

    expect(screen.queryByText("Ledger Key Ring backends")).toBeNull();
    expect(screen.getByText("Block explorers")).toBeVisible();
  });

  it("should say when nothing matches the search", async () => {
    renderAppConfig();

    await userEvent.type(screen.getByPlaceholderText("Search config..."), "nothing");

    expect(screen.getByText("Nothing matches.")).toBeVisible();
  });

  it("should list the fixed values, without Dev when the default is prod", () => {
    renderAppConfig({ fixedValues: [keycloakRealm] });

    expect(screen.getByText("Fixed values")).toBeVisible();
    expect(screen.getByText("keycloakRealm")).toBeVisible();
    expect(screen.queryByRole("radio", { name: "dev" })).toBeNull();
    const field = screen.getByRole("textbox", { name: "keycloakRealm" });
    expect(field).toHaveValue("ledger-bc-customers");
    expect(field).toHaveAttribute("readonly");
  });

  describe("dev values", () => {
    it("should offer Dev, and put a fixed value on it", async () => {
      const { onSelect } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [{ ...ledgerKeyRingOnDev, savedSelectionId: undefined }],
        fixedValues: [keycloakRealm],
      });

      expect(screen.getAllByRole("radio", { name: "dev" })).toHaveLength(2);
      expect(screen.getByRole("radio", { name: "fixed" })).toBeChecked();

      await userEvent.click(screen.getAllByRole("radio", { name: "dev" })[1]);

      expect(onSelect).toHaveBeenCalledWith("keycloakRealm", "dev");
    });

    it("should save a text typed on Dev once the field loses focus", async () => {
      const { onSetDevValue } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [ledgerKeyRingOnDev],
      });
      const field = screen.getByRole("textbox", { name: "keycloakBaseUrl" });

      expect(field).toHaveValue(stagingUrl);
      expect(field).not.toHaveAttribute("readonly");

      await userEvent.clear(field);
      await userEvent.type(field, "http://localhost:8080");
      expect(onSetDevValue).not.toHaveBeenCalled();
      await userEvent.tab();

      expect(onSetDevValue).toHaveBeenCalledWith("keycloakBaseUrl", "http://localhost:8080");
    });

    it("should save a text typed on Dev on Enter", async () => {
      const { onSetDevValue } = renderAppConfig({
        defaultOptionId: "staging",
        fixedValues: [{ ...keycloakRealm, isDevSaved: true }],
      });

      await userEvent.type(screen.getByRole("textbox", { name: "keycloakRealm" }), "-dev{Enter}");

      expect(onSetDevValue).toHaveBeenCalledWith("keycloakRealm", "ledger-bc-customers-dev");
    });

    it("should show a refused dev value with why", () => {
      renderAppConfig({
        defaultOptionId: "staging",
        switches: [
          {
            ...ledgerKeyRingOnDev,
            values: [
              {
                ...ledgerKeyRingOnDev.values[0],
                rejectedDevValue: { value: "not a url", message: "Invalid URL" },
              },
            ],
          },
        ],
      });

      expect(screen.getByRole("textbox", { name: "keycloakBaseUrl" })).toHaveValue("not a url");
      expect(screen.getByText("Invalid URL")).toBeVisible();
    });

    it("should not reload while a refused text is shown, once its field is left", async () => {
      const onReloadApp = jest.fn();
      render(<RefusingHost onReloadApp={onReloadApp} />);
      const field = screen.getByRole("textbox", { name: "keycloakBaseUrl" });

      await userEvent.clear(field);
      await userEvent.type(field, "not a url");
      await userEvent.tab();
      expect(screen.getByText("Invalid URL")).toBeVisible();
      await userEvent.click(screen.getByRole("button", { name: "Reload" }));

      expect(onReloadApp).not.toHaveBeenCalled();
      expect(field).toHaveValue("not a url");
    });

    it("should reset a saved dev value", async () => {
      const { onRemoveDevValue } = renderAppConfig({
        defaultOptionId: "staging",
        switches: [
          {
            ...ledgerKeyRingOnDev,
            values: [
              {
                ...ledgerKeyRingOnDev.values[0],
                nextValue: "http://localhost:8080",
                hasDevValue: true,
              },
            ],
          },
        ],
      });

      await userEvent.click(screen.getByRole("button", { name: "Reset" }));

      expect(onRemoveDevValue).toHaveBeenCalledWith("keycloakBaseUrl");
    });

    it("should keep a value that is not a string read-only on Dev", () => {
      renderAppConfig({
        defaultOptionId: "staging",
        switches: [
          {
            ...ledgerKeyRingOnDev,
            values: [{ ...keycloakBaseUrl, name: "timeoutMs", nextValue: 3000, baseValue: 3000 }],
          },
        ],
      });

      const field = screen.getByRole("textbox", { name: "timeoutMs" });
      expect(field).toHaveValue("3000");
      expect(field).toHaveAttribute("readonly");
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
