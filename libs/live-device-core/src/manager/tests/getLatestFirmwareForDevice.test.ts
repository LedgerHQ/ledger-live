import { UnknownMCU } from "@ledgerhq/errors";
import { getLatestFirmwareForDevice } from "../getLatestFirmwareForDevice";
import { ManagerApiRepository } from "../ManagerApiRepository";
import { StubManagerApiRepository } from "../StubManagerApiRepository";
import { aDeviceInfoBuilder } from "../../types/mocks";
import { DeviceVersion, FinalFirmware, McuVersion, OsuFirmware } from "../../types";

jest.mock("../ManagerApiRepository");

describe("getLatestFirmwareForDevice", () => {
  let mockedManagerApiRepository: ManagerApiRepository;

  beforeEach(() => {
    mockedManagerApiRepository = new StubManagerApiRepository();
    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest
      .spyOn(mockedManagerApiRepository, "fetchMcus")
      .mockResolvedValue(Promise.resolve([{ name: "42", id: 42 } as McuVersion]));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("should throws error for unknown mcu", async () => {
    // Given
    // Using a fixture builder - we could create that for all our entities
    const deviceInfo = aDeviceInfoBuilder({ mcuVersion: "42", isOSU: true });

    jest.spyOn(mockedManagerApiRepository, "fetchMcus").mockResolvedValue([]);
    jest.spyOn(mockedManagerApiRepository, "getCurrentOsu").mockResolvedValue({} as OsuFirmware);

    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository: mockedManagerApiRepository,
    };

    // When
    const response = getLatestFirmwareForDevice(params);

    // Then
    expect(response).rejects.toBeInstanceOf(UnknownMCU);
  });

  test("should return an update without flashing mcu", async () => {
    // Given
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, mcuVersion: "42" });

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

  test("shouldn't return an available update when no mcu found", async () => {
    // Given
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, mcuVersion: "42" });

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

  test("should return an available OS update", async () => {
    // Given
    const deviceInfo = aDeviceInfoBuilder({ isOSU: false, mcuVersion: "42" });
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
    jest.spyOn(mockedManagerApiRepository, "getCurrentOsu").mockResolvedValue({} as OsuFirmware);
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
      .spyOn(mockedManagerApiRepository, "getCurrentOsu")
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
