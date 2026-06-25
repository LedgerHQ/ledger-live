import React from "react";
import { getDeviceModel } from "@ledgerhq/devices";
import { ConnectDeviceUIStateTypes, type ConnectDeviceUIState } from "@ledgerhq/live-dmk-desktop";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { screen } from "@testing-library/react";

import { makeKnownDevice, renderWithUser } from "../testUtils";
import { WaitingForSelectedDeviceState } from "./WaitingForSelectedDeviceState";

jest.mock("~/renderer/components/DeviceAction/animations", () => ({
  getDeviceAnimation: jest.fn(() => undefined),
}));

jest.mock("~/renderer/hooks/useTheme", () => () => ({ theme: "dark" }));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

type WaitingForSelectedDeviceUIState = Extract<
  ConnectDeviceUIState,
  { type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice }
>;

function renderState(device: WaitingForSelectedDeviceUIState["device"]) {
  return renderWithUser(
    <WaitingForSelectedDeviceState
      state={{
        type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
        device,
      }}
    />,
  );
}

describe("WaitingForSelectedDeviceState", () => {
  it("should render the selected device name and product-specific title", () => {
    renderState(makeKnownDevice({ name: "My Ledger" }));

    expect(screen.getByText("My Ledger")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: new RegExp(
          `Power on and unlock your ${getDeviceModel(DeviceModelId.nanoX).productName.replace(
            /\u00a0/g,
            "\\s+",
          )}`,
        ),
      }),
    ).toBeVisible();
  });

  it("should render the fallback device name when the selected device has no name", () => {
    renderState(makeKnownDevice({ name: null }));

    expect(screen.getByText("Ledger device")).toBeVisible();
  });
});
