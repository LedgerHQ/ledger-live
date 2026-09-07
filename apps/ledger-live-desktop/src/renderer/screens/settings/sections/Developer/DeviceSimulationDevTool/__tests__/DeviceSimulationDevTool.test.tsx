import React from "react";
import { DeviceModelId } from "@ledgerhq/devices";
import { render, screen } from "tests/testSetup";
import DeviceSimulationDevTool from "../index";

describe("DeviceSimulationDevTool", () => {
  it("should show the active QA devices summary when collapsed", () => {
    render(<DeviceSimulationDevTool />);

    expect(
      screen.getByText(
        "Simulate device history to test Nano-user upsell surfaces without physical devices.",
      ),
    ).toBeVisible();
    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: none",
    );
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    expect(screen.queryByTestId("device-simulation-reset")).not.toBeInTheDocument();
  });

  it("should expand and collapse the device simulation controls", async () => {
    const { user } = render(<DeviceSimulationDevTool />);

    await user.click(screen.getByRole("button", { name: "Show" }));

    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: none",
    );
    expect(screen.getAllByRole("switch")).toHaveLength(6);

    await user.click(screen.getByRole("button", { name: "Hide" }));

    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: none",
    );
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    expect(screen.queryByTestId("device-simulation-reset")).not.toBeInTheDocument();
  });

  it("should display translated device names and reset the history", async () => {
    const { user, store } = render(<DeviceSimulationDevTool />, {
      initialState: {
        settings: {
          devicesModelList: [DeviceModelId.nanoSP, DeviceModelId.stax],
        },
      },
    });

    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: Nano S Plus, Ledger Stax",
    );

    await user.click(screen.getByRole("button", { name: "Show" }));

    const resetButton = screen.getByRole("button", { name: "Reset device history" });
    expect(resetButton).toBeEnabled();
    await user.click(resetButton);

    expect(store.getState().settings.devicesModelList).toEqual([]);
    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: none",
    );
    expect(resetButton).toBeDisabled();
  });

  it("should update device history when toggled on", async () => {
    const { user, store } = render(<DeviceSimulationDevTool />);

    await user.click(screen.getByRole("button", { name: "Show" }));

    const switches = screen.getAllByRole("switch");
    await user.click(switches[0]);

    expect(store.getState().settings.devicesModelList).toEqual([DeviceModelId.nanoS]);
    expect(screen.getByTestId("device-simulation-current-history")).toHaveTextContent(
      "Active QA devices: Nano S",
    );
  });
});
