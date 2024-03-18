import { getLatestFirmwareForDevice } from "./getLatestFirmwareForDevice";
import { ManagerApiRepository } from "../repositories/ManagerApiRepository";
import { aDeviceInfoBuilder } from "../../../mock/fixtures/aDeviceInfo";
import { DeviceVersion, FinalFirmware, OsuFirmware } from "@ledgerhq/types-live";
import { UnknownMCU } from "@ledgerhq/errors";
import { StubManagerApiRepository } from "../repositories/StubManagerApiRepository";
jest.mock("../repositories/ManagerApiRepository");

describe("getLatestFirmwareForDevice", () => {
  let mockedManagerApiRepository: ManagerApiRepository;

  beforeEach(() => {
    // Clear the methods we are using in our test
    jest.resetAllMocks();
    mockedManagerApiRepository = new StubManagerApiRepository();
  });

  it("throws an Error for unknown mcu", async () => {
    // given
    // Using a fixture builder - we could create that for all our entities
    const deviceInfo = aDeviceInfoBuilder({ mcuVersion: "42", isOSU: true });

    jest.spyOn(mockedManagerApiRepository, "fetchMcus").mockResolvedValue([]);
    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest.spyOn(mockedManagerApiRepository, "getCurrentOSU").mockResolvedValue({} as OsuFirmware);

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

  it("should return an update without flashing mcu", async () => {
    // Given
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, mcuVersion: "42" });

    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest
      .spyOn(mockedManagerApiRepository, "fetchMcus")
      .mockResolvedValue(Promise.resolve([{ name: "42", id: 42 }]));
    jest
      .spyOn(mockedManagerApiRepository, "getCurrentFirmware")
      .mockResolvedValue({ se_firmware: 21 } as FinalFirmware);
    jest
      .spyOn(mockedManagerApiRepository, "fetchLatestFirmware")
      .mockResolvedValue({} as OsuFirmware);
    jest
      .spyOn(mockedManagerApiRepository, "getFinalFirmwareById")
      .mockResolvedValue({ mcu_versions: [42] } as FinalFirmware);

    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository: mockedManagerApiRepository,
    };

    // When
    const result = await getLatestFirmwareForDevice(params);

    // Then
    expect(result).toMatchObject({ shouldFlashMCU: false });
  });

  it("shouldn't return an available update when no mcu found", async () => {
    // Given
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, mcuVersion: "42" });

    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest
      .spyOn(mockedManagerApiRepository, "fetchMcus")
      .mockResolvedValue(Promise.resolve([{ name: "42", id: "MCU_TEST" }]));
    jest
      .spyOn(mockedManagerApiRepository, "getCurrentFirmware")
      .mockResolvedValue({ id: 21 } as FinalFirmware);
    jest.spyOn(mockedManagerApiRepository, "fetchLatestFirmware").mockResolvedValue(null);

    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository: mockedManagerApiRepository,
    };

    // When
    const result = await getLatestFirmwareForDevice(params);

    // Then
    expect(result).toBeNull();
  });

  it("should return an available OS update", async () => {
    // Given
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, mcuVersion: "42" });

    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest
      .spyOn(mockedManagerApiRepository, "fetchMcus")
      .mockResolvedValue(Promise.resolve([{ name: "42", id: 42 }]));
    jest
      .spyOn(mockedManagerApiRepository, "getCurrentFirmware")
      .mockResolvedValue({ se_firmware: 21 } as FinalFirmware);
    jest
      .spyOn(mockedManagerApiRepository, "fetchLatestFirmware")
      .mockResolvedValue({} as OsuFirmware);
    jest.spyOn(mockedManagerApiRepository, "getFinalFirmwareById").mockResolvedValue({
      name: "VERSION_UPDATE_TEST",
      mcu_versions: [42],
    } as FinalFirmware);

    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository: mockedManagerApiRepository,
    };

    // When
    const result = await getLatestFirmwareForDevice(params);

    // Then
    expect(result).toHaveProperty(["final"]);
    expect(result).toHaveProperty(["osu"]);
    expect(result).toHaveProperty(["shouldFlashMCU"]);
  });

  test("should return an update with device isOSU true", async () => {
    const deviceInfo = aDeviceInfoBuilder({ mcuVersion: "42" });
    jest
      .spyOn(mockedManagerApiRepository, "fetchMcus")
      .mockResolvedValue(Promise.resolve([{ name: "42", id: 42 }]));
    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest.spyOn(mockedManagerApiRepository, "getCurrentOSU").mockResolvedValue({} as OsuFirmware);
    jest.spyOn(mockedManagerApiRepository, "getFinalFirmwareById").mockResolvedValue({
      name: "VERSION_UPDATE_TEST",
      mcu_versions: [42],
    } as FinalFirmware);
    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository: mockedManagerApiRepository,
    };

    // When
    const result = await getLatestFirmwareForDevice(params);

    // Then
    expect(result).toHaveProperty(["final"]);
    expect(result).toHaveProperty(["osu"]);
    expect(result).toHaveProperty(["shouldFlashMCU"]);
  });

  test("shouldn't return an update with device isOSU true", async () => {
    const deviceInfo = aDeviceInfoBuilder({ mcuVersion: "42" });
    jest
      .spyOn(mockedManagerApiRepository, "fetchMcus")
      .mockResolvedValue(Promise.resolve([{ name: "42", id: 42 }]));
    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest
      .spyOn(mockedManagerApiRepository, "getCurrentOSU")
      .mockResolvedValue(null as unknown as OsuFirmware);
    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository: mockedManagerApiRepository,
    };

    // When
    const result = await getLatestFirmwareForDevice(params);

    // Then
    expect(result).toBeNull();
  });
});
