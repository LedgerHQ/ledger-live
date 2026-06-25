import React from "react";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { screen } from "@testing-library/react";

import { makeDisplayedDevice, makeKnownDevice, renderWithUser } from "../testUtils";
import { DiscoveringState } from "./DiscoveringState";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

type DiscoveringUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.Discovering }
>;

function renderState(state: Partial<DiscoveringUIState> = {}) {
  return renderWithUser(
    <DiscoveringState
      state={{
        type: ConnectDeviceUIStateTypes.Discovering,
        devices: [
          makeDisplayedDevice({
            type: "available",
            knownDevice: makeKnownDevice({ name: "Available Ledger" }),
          }),
          makeDisplayedDevice({
            type: "not-available",
            knownDevice: makeKnownDevice({ name: "Unavailable Ledger" }),
          }),
        ],
        ...state,
      }}
    />,
  );
}

describe("DiscoveringState", () => {
  it("should render the discovering title and device rows", () => {
    renderState();

    expect(screen.getByText("Select a device")).toBeVisible();
    expect(screen.getByText("Available Ledger")).toBeVisible();
    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
  });

  it("should forward device row selection callbacks", async () => {
    const onSelect = jest.fn();
    const { user } = renderState({
      devices: [
        makeDisplayedDevice({
          knownDevice: makeKnownDevice({ name: "My Ledger" }),
          onSelect,
        }),
      ],
    });

    await user.click(screen.getByText("My Ledger"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
