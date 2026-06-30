import React from "react";
import { getProductName } from "@ledgerhq/devices";
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
  it("GIVEN an available device WHEN rendering THEN it shows the device name and available status", () => {
    // GIVEN
    const device = makeDisplayedDevice({
      type: "available",
      knownDevice: makeKnownDevice({ name: "Available Ledger" }),
    });

    // WHEN
    renderWithUser(<DeviceListItem device={device} />);

    // THEN
    expect(screen.getByText("Available Ledger")).toBeVisible();
    expect(screen.getByText("Available")).toBeVisible();
  });

  it("GIVEN an unavailable device WHEN rendering THEN it shows the device name and not connected status", () => {
    // GIVEN
    const device = makeDisplayedDevice({
      type: "not-available",
      knownDevice: makeKnownDevice({ name: "Unavailable Ledger" }),
    });

    // WHEN
    renderWithUser(<DeviceListItem device={device} />);

    // THEN
    expect(screen.getByText("Unavailable Ledger")).toBeVisible();
    expect(screen.getByText("Not connected")).toBeVisible();
  });

  it("GIVEN a known device without a name WHEN rendering THEN it falls back to the product name", () => {
    // GIVEN
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({ name: null }),
    });

    // WHEN
    renderWithUser(<DeviceListItem device={device} />);

    // THEN
    expect(
      screen.getByText(new RegExp(getProductName(DeviceModelId.nanoX).replace(/\u00a0/g, "\\s+"))),
    ).toBeVisible();
  });

  it("GIVEN a selectable device WHEN clicking the device row THEN it calls the selection callback", async () => {
    // GIVEN
    const onSelect = jest.fn();
    const device = makeDisplayedDevice({
      knownDevice: makeKnownDevice({
        name: "Ledger Stax",
        deviceModelId: DeviceModelId.stax,
      }),
      onSelect,
    });
    const { user } = renderWithUser(<DeviceListItem device={device} />);

    // WHEN
    await user.click(screen.getByText("Ledger Stax"));

    // THEN
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
