import { renderHook, waitFor } from "@testing-library/react";
import {
  HttpManagerApiRepository,
  type DeviceInfoEntity,
  type FinalFirmware,
  type OsuFirmware,
} from "@ledgerhq/device-core";

import type { UseGetLatestFirmwareForDeviceOptions } from "../types";
import { useGetLatestFirmware } from "./useGetLatestFirmware";

const mockedData = {
  osu: {} as OsuFirmware,
  final: {} as FinalFirmware,
  shouldFlashMCU: false,
};
jest.mock("@ledgerhq/device-core", () => {
  return {
    HttpManagerApiRepository: jest.fn().mockImplementation(() => {
      return {};
    }),
    getLatestFirmwareForDevice: jest.fn().mockImplementation(() => Promise.resolve(mockedData)),
  };
});

describe("useGetLatestFirmware", () => {
  test("it returns latest firmware", async () => {
    const mockedOptions: UseGetLatestFirmwareForDeviceOptions = {
      deviceInfo: { mcuVersion: "0.1.0" } as DeviceInfoEntity,
      providerId: 1,
      userId: "userId",
      managerApiRepository: new HttpManagerApiRepository("shiba inu", "Akita inu"),
    };
    const { result } = renderHook(() => useGetLatestFirmware(mockedOptions));
    await waitFor(() => {
      expect(result.current).toEqual(mockedData);
    });
  });
});
