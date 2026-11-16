/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor } from "@testing-library/react";
import { listMockServerDevices, type MockServerDevice } from "./mockServerApi";
import { useMockServerDevices } from "./useMockServerDevices";

jest.mock("./mockServerApi", () => ({
  ...jest.requireActual("./mockServerApi"),
  listMockServerDevices: jest.fn(),
}));

const listMockServerDevicesMock = jest.mocked(listMockServerDevices);

const stax: MockServerDevice = {
  id: "device-1",
  name: "My Stax",
  device_type: "stax",
  connectivity_type: "BLE",
};

describe("useMockServerDevices", () => {
  beforeEach(() => {
    listMockServerDevicesMock.mockReset();
  });

  it("should list the session devices when given a connection", async () => {
    listMockServerDevicesMock.mockResolvedValue([stax]);

    const { result } = renderHook(() =>
      useMockServerDevices({ url: "https://mock.example", token: "token-1" }),
    );

    await waitFor(() => expect(result.current).toEqual([stax]));
    expect(listMockServerDevicesMock).toHaveBeenCalledWith({
      url: "https://mock.example",
      token: "token-1",
    });
  });

  it("should list nothing without a connection", () => {
    const { result } = renderHook(() => useMockServerDevices(null));

    expect(result.current).toEqual([]);
    expect(listMockServerDevicesMock).not.toHaveBeenCalled();
  });
});
