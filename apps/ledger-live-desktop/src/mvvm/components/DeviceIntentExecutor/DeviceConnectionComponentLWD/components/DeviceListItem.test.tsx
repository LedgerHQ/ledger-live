import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { screen } from "@testing-library/react";

import { makeDisplayedDevice, makeKnownDevice, renderWithUser } from "../testUtils";
import { DeviceListItem } from "./DeviceListItem";

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, string>) => {
      const { mockT } = jest.requireActual("../testUtils");
      return mockT(key, params);
    },
  }),
}));

describe("DeviceListItem", () => {
  it("should render an available device with its status", () => {
    const device = makeDisplayedDevice({
      type: "available",
      knownDevice: makeKnownDevice({ name: "Available Ledger" }),
    });

    renderWithUser(<DeviceListItem device={device} />);

    expect(screen.getByText("Available Ledger")).toBeVisible();
    expect(screen.getByText("Available")).toBeVisible();
  });

  it("should render an unavailable device with its status", () => {
    const device = makeDisplayedDevice({
      type: "not-available",
      knownDevice: makeKnownDevice({ name: "Unavailable Ledger" }),
    });

    renderWithUser(<DeviceListItem device={device} />);

    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
    expect(screen.getByText("Not connected")).toBeVisible();
  });

  it("should render the fallback device name when a known device has no name", () => {
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ name: null }),
    });

    renderWithUser(<DeviceListItem device={device} />);

    expect(screen.getByText("Ledger device")).toBeVisible();
  });

  it("should call the selected device callback when a device is clicked", async () => {
    const onSelect = jest.fn();
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({
        name: "Ledger Stax",
        deviceModelId: DeviceModelId.stax,
      }),
      onSelect,
    });
    const { user } = renderWithUser(<DeviceListItem device={device} />);

    await user.click(screen.getByText("Ledger Stax"));

    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
