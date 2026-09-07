import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { DeviceSimulationDevToolRow } from "../index";
import DeviceSimulationDevToolContent from "../DeviceSimulationDevToolContent";

const emptyKnownDeviceModelIds = {
  blue: false,
  nanoS: false,
  nanoSP: false,
  nanoX: false,
  stax: false,
  europa: false,
  apex: false,
};

const withSettings =
  (settings: Partial<State["settings"]>) =>
  (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      ...settings,
    },
  });

describe("DeviceSimulationDevToolRow", () => {
  it("should render a settings row with the current QA device summary", () => {
    render(<DeviceSimulationDevToolRow />, {
      overrideInitialState: withSettings({
        knownDeviceModelIds: {
          ...emptyKnownDeviceModelIds,
          apex: true,
        },
      }),
    });

    expect(screen.getByTestId("device-simulation-row")).toBeTruthy();
    expect(screen.getByText("Device simulation (QA)")).toBeTruthy();
    expect(screen.getByText("Active QA devices: Ledger Flex Plus")).toBeTruthy();
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    expect(screen.queryByTestId("device-simulation-reset")).toBeNull();
  });
});

describe("DeviceSimulationDevToolContent", () => {
  it("should render device controls with empty history and disabled reset", () => {
    render(<DeviceSimulationDevToolContent />, {
      overrideInitialState: withSettings({
        knownDeviceModelIds: emptyKnownDeviceModelIds,
      }),
    });

    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: none",
    );
    expect(screen.getByTestId("device-simulation-reset")).toBeDisabled();
    expect(screen.getAllByRole("switch")).toHaveLength(6);
  });

  it("should display translated device names and reset the QA history", async () => {
    const { user, store } = render(<DeviceSimulationDevToolContent />, {
      overrideInitialState: withSettings({
        knownDeviceModelIds: {
          ...emptyKnownDeviceModelIds,
          nanoSP: true,
          stax: true,
        },
      }),
    });

    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: Nano S Plus, Ledger Stax",
    );

    const resetButton = screen.getByTestId("device-simulation-reset");
    expect(resetButton).toBeEnabled();
    await user.press(resetButton);

    expect(store.getState().settings.knownDeviceModelIds).toMatchObject({
      nanoS: false,
      nanoSP: false,
      nanoX: false,
      stax: false,
      europa: false,
      apex: false,
    });
    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: none",
    );
    expect(resetButton).toBeDisabled();
  });

  it("should update device history when toggled on", () => {
    const { store } = render(<DeviceSimulationDevToolContent />, {
      overrideInitialState: withSettings({
        knownDeviceModelIds: emptyKnownDeviceModelIds,
      }),
    });

    const switches = screen.getAllByRole("switch");
    fireEvent(switches[0], "valueChange", true);

    expect(store.getState().settings.knownDeviceModelIds.nanoS).toBe(true);
    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: Nano S",
    );
  });

  it("should remove a device from history when toggled off", () => {
    const { store } = render(<DeviceSimulationDevToolContent />, {
      overrideInitialState: withSettings({
        knownDeviceModelIds: {
          ...emptyKnownDeviceModelIds,
          nanoS: true,
          nanoX: true,
        },
      }),
    });

    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: Nano S, Nano X",
    );

    const switches = screen.getAllByRole("switch");
    fireEvent(switches[0], "valueChange", false);

    expect(store.getState().settings.knownDeviceModelIds.nanoS).toBe(false);
    expect(store.getState().settings.knownDeviceModelIds.nanoX).toBe(true);
    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: Nano X",
    );
  });
});
