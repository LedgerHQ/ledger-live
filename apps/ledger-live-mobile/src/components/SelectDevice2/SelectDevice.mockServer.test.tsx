import React from "react";
import { render, screen, waitFor } from "@tests/test-renderer";
import { HttpResponse, http, server } from "@tests/server";
import {
  configureMockServerTransport,
  mockserverIdentifier,
  resetMockServerTransport,
} from "@ledgerhq/live-dmk-mobile";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { State } from "~/reducers/types";
import SelectDevice from ".";

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: jest.fn(() => ({ navigate: jest.fn(), addListener: jest.fn() })),
  useIsFocused: jest.fn(() => true),
}));

const MOCK_SERVER_URL = "https://mock-server.test";

const endpoints = { devices: jest.fn<Response, [{ request: Request }]>() };

const withPairedBleNanoX = (state: State): State => ({
  ...state,
  ble: {
    ...state.ble,
    knownDevices: [{ id: "ble-nano-x", name: "Paired Nano X", modelId: DeviceModelId.nanoX }],
  },
});

describe("SelectDevice in mock server mode", () => {
  beforeEach(() => {
    endpoints.devices
      .mockReset()
      .mockImplementation(() =>
        HttpResponse.json([
          { id: "device-1", name: "Mock Stax", device_type: "stax", connectivity_type: "BLE" },
        ]),
      );
    server.use(http.get(`${MOCK_SERVER_URL}/devices`, endpoints.devices));
    configureMockServerTransport({ url: MOCK_SERVER_URL, token: "token-1" });
  });

  afterEach(() => {
    resetMockServerTransport();
  });

  it("should list only the mock server session devices when mock server mode is on", async () => {
    render(<SelectDevice onSelect={jest.fn()} requestToSetHeaderOptions={jest.fn()} />, {
      overrideInitialState: withPairedBleNanoX,
    });

    expect(await screen.findByText("Mock Stax")).toBeVisible();
    expect(screen.queryByText("Paired Nano X")).toBeNull();
  });

  it("should select a BLE mock device without the Bluetooth and locked checks", async () => {
    const onSelect = jest.fn();
    const { store, user } = render(
      <SelectDevice onSelect={onSelect} requestToSetHeaderOptions={jest.fn()} />,
    );

    await user.press(await screen.findByText("Mock Stax"));

    await waitFor(() => expect(onSelect).toHaveBeenCalledTimes(1));
    expect(onSelect.mock.calls[0][0]).toMatchObject({
      deviceId: "mockserver|device-1",
      wired: false,
      modelId: DeviceModelId.stax,
    });
    expect(onSelect.mock.calls[0][1]).toMatchObject({
      id: "device-1",
      transport: mockserverIdentifier,
    });
    expect(store.getState().ble.knownDevices).toEqual([]);
  });
});
