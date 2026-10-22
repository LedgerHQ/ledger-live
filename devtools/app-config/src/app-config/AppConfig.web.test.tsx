import { render, screen } from "@support/jest/devtools/web";
import userEvent from "@testing-library/user-event";
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

  it("should show the values the next session runs on", () => {
    renderAppConfig({
      switches: [
        {
          ...ledgerKeyRing,
          savedSelectionId: "staging",
          values: [{ ...keycloakBaseUrl, nextValue: stagingUrl }],
        },
      ],
    });

    expect(screen.getByText(stagingUrl)).toBeVisible();
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
    expect(screen.getByText("ledger-bc-customers")).toBeVisible();
    expect(screen.queryByRole("radio", { name: "dev" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "keycloakRealm" })).toBeNull();
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
