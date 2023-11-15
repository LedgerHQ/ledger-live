import { getLatestFirmwareForDevice } from "./getLatestFirmwareForDevice";
import { ManagerApiPort } from "../repositories/ManagerApiRepository";
import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import { aDeviceInfoBuilder } from "../../mock/fixtures/aDeviceInfo";
import { DeviceVersion, OsuFirmware } from "@ledgerhq/types-live";
import { UnknownMCU } from "@ledgerhq/errors";
jest.mock("../repositories/ManagerApiRepository");

const mockedFetchMcus = jest.fn();
const mockedGetDeviceVersion = jest.fn();
const mockedGetCurrentOSU = jest.fn();
const mockedManagerApiRepository: ManagerApiPort = {
  fetchLatestFirmware: jest.fn(),
  fetchMcus: mockedFetchMcus,
  getDeviceVersion: mockedGetDeviceVersion,
  getCurrentOSU: mockedGetCurrentOSU,
  getCurrentFirmware: jest.fn(),
  getFinalFirmwareById: jest.fn(),
};

describe("getLatestFirmwareForDevice", () => {
  beforeEach(() => {
    // Clear the methods we are using in our test
    mockedFetchMcus.mockClear();
  });

  test("Error throw for unknown mcu", async () => {
    // given
    // Using a fixture builder - we could create that for all our entities
    const deviceInfo = aDeviceInfoBuilder({ mcuVersion: "42", isOSU: true });

    mockedFetchMcus.mockResolvedValue([]);
    mockedGetDeviceVersion.mockResolvedValue({ id: 42 } as DeviceVersion);
    mockedGetCurrentOSU.mockResolvedValue({} as OsuFirmware);

    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository: mockedManagerApiRepository,
    };

    // when
    const response = getLatestFirmwareForDevice(params);
    // then
    expect(response).rejects.toBeInstanceOf(UnknownMCU);
  });
});
