import { FirmwareNotRecognized, NetworkDown } from "@ledgerhq/errors";
import { FinalFirmware } from "@ledgerhq/types-live";
import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
import { DeviceVersionEntity } from "../entities/DeviceVersionEntity";
import {
  LanguagePackageEntity,
  LanguagePackageResponseEntity,
} from "../entities/LanguagePackageEntity";
import { HttpManagerApiRepository } from "./HttpManagerApiRepository";

const getUserHashesModule = jest.requireActual("../../../user");
const networkModule = jest.requireActual("@ledgerhq/live-network/network");

describe("HttpManagerApiRepository", () => {
  let httpManagerApiRepository: HttpManagerApiRepository;
  let getUserHashesSpy: jest.SpyInstance;
  let networkSpy: jest.SpyInstance;

  beforeEach(() => {
    httpManagerApiRepository = new HttpManagerApiRepository("http://managerApiBase.com", "1.2.3");
    getUserHashesSpy = jest.spyOn(getUserHashesModule, "getUserHashes");
    networkSpy = jest.spyOn(networkModule, "default");
    networkSpy.mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test("fetchLatestFirmware should call network() with the correct parameters", async () => {
    getUserHashesSpy.mockReturnValue({
      firmwareSalt: "mockedFirmwareSalt",
    });
    const params: Parameters<typeof httpManagerApiRepository.fetchLatestFirmware>[0] = {
      current_se_firmware_final_version: 888,
      device_version: 123,
      providerId: 12,
      userId: "userId",
    };

    await httpManagerApiRepository.fetchLatestFirmware(params).catch(() => {
      // ignore the error in this test case
    });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "POST",
      url: "http://managerApiBase.com/get_latest_firmware?livecommonversion=1.2.3&salt=mockedFirmwareSalt",
      data: {
        current_se_firmware_final_version: 888,
        device_version: 123,
        provider: 12,
      },
    });
  });

  test("fetchLatestFirmware should return null if data.result is null", async () => {
    getUserHashesSpy.mockReturnValue({
      firmwareSalt: "mockedFirmwareSalt",
    });
    const params: Parameters<typeof httpManagerApiRepository.fetchLatestFirmware>[0] = {
      current_se_firmware_final_version: 888,
      device_version: 123,
      providerId: 12,
      userId: "userId",
    };
    networkSpy.mockResolvedValue({
      data: {
        result: "null",
      },
    });

    const result = await httpManagerApiRepository.fetchLatestFirmware(params);

    expect(result).toBeNull();
  });

  test("fetchLatestFirmware should return data.se_firmware_osu_version", async () => {
    getUserHashesSpy.mockReturnValue({
      firmwareSalt: "mockedFirmwareSalt",
    });
    const params: Parameters<typeof httpManagerApiRepository.fetchLatestFirmware>[0] = {
      current_se_firmware_final_version: 888,
      device_version: 123,
      providerId: 12,
      userId: "userId",
    };
    networkSpy.mockResolvedValue({
      data: {
        result: "mockedResult",
        se_firmware_osu_version: "mockedOsuFirmware",
      },
    });

    const result = await httpManagerApiRepository.fetchLatestFirmware(params);

    expect(result).toBe("mockedOsuFirmware");
  });

  test("fetchMcus should call network() with the correct parameters", async () => {
    await httpManagerApiRepository.fetchMcus().catch(() => {
      // ignore the error in this test case
    });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "GET",
      url: "http://managerApiBase.com/mcu_versions?livecommonversion=1.2.3",
    });
  });

  test("fetchMcus should return data", async () => {
    networkSpy.mockResolvedValue({
      data: "mockedData",
    });

    const result = await httpManagerApiRepository.fetchMcus();

    expect(result).toBe("mockedData");
  });

  test("getDeviceVersion should call network() with the correct parameters", async () => {
    const params: Parameters<typeof httpManagerApiRepository.getDeviceVersion>[0] = {
      targetId: 123,
      providerId: 12,
    };

    await httpManagerApiRepository.getDeviceVersion(params).catch(() => {
      // ignore the error in this test case
    });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "POST",
      url: "http://managerApiBase.com/get_device_version?livecommonversion=1.2.3",
      data: {
        target_id: 123,
        provider: 12,
      },
    });
  });

  test("getDeviceVersion should throw a FirmwareNotRecognized error if status is 404", async () => {
    networkSpy.mockRejectedValue({
      status: 404,
    });

    await expect(
      httpManagerApiRepository.getDeviceVersion({
        targetId: 123,
        providerId: 12,
      }),
    ).rejects.toThrow(FirmwareNotRecognized);
  });

  test("getDeviceVersion should throw a FirmwareNotRecognized error if response.status is 404", async () => {
    networkSpy.mockRejectedValue({
      response: {
        status: 404,
      },
    });

    await expect(
      httpManagerApiRepository.getDeviceVersion({
        targetId: 123,
        providerId: 12,
      }),
    ).rejects.toThrow(FirmwareNotRecognized);
  });

  test("getDeviceVersion should return data", async () => {
    networkSpy.mockResolvedValue({
      data: "mockedData",
    });

    const result = await httpManagerApiRepository.getDeviceVersion({
      targetId: 123,
      providerId: 12,
    });

    expect(result).toBe("mockedData");
  });

  test("getCurrentOSU should call network() with the correct parameters", async () => {
    const params: Parameters<typeof httpManagerApiRepository.getCurrentOSU>[0] = {
      deviceId: 123,
      providerId: 12,
      version: "mockedVersion",
    };

    await httpManagerApiRepository.getCurrentOSU(params).catch(() => {
      // ignore the error in this test case
    });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "POST",
      url: "http://managerApiBase.com/get_osu_version?livecommonversion=1.2.3",
      data: {
        device_version: 123,
        provider: 12,
        version_name: "mockedVersion-osu",
      },
    });
  });

  test("getCurrentOSU should return data", async () => {
    networkSpy.mockResolvedValue({
      data: "mockedData",
    });

    const result = await httpManagerApiRepository.getCurrentOSU({
      deviceId: 123,
      providerId: 12,
      version: "mockedVersion",
    });

    expect(result).toBe("mockedData");
  });

  test("getCurrentFirmware should call network() with the correct parameters", async () => {
    const params: Parameters<typeof httpManagerApiRepository.getCurrentFirmware>[0] = {
      deviceId: 123,
      providerId: 12,
      version: "mockedVersion",
    };

    await httpManagerApiRepository.getCurrentFirmware(params).catch(() => {
      // ignore the error in this test case
    });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "POST",
      url: "http://managerApiBase.com/get_firmware_version?livecommonversion=1.2.3",
      data: {
        device_version: 123,
        provider: 12,
        version_name: "mockedVersion",
      },
    });
  });

  test("getCurrentFirmware should throw a FirmwareNotRecognized error if status is 404", async () => {
    networkSpy.mockRejectedValue({
      status: 404,
    });

    await expect(
      httpManagerApiRepository.getCurrentFirmware({
        deviceId: 123,
        providerId: 12,
        version: "mockedVersion",
      }),
    ).rejects.toThrow(FirmwareNotRecognized);
  });

  test("getCurrentFirmware should throw a FirmwareNotRecognized error if response.status is 404", async () => {
    networkSpy.mockRejectedValue({
      response: {
        status: 404,
      },
    });

    await expect(
      httpManagerApiRepository.getCurrentFirmware({
        deviceId: 123,
        providerId: 12,
        version: "mockedVersion",
      }),
    ).rejects.toThrow(FirmwareNotRecognized);
  });

  test("getCurrentFirmware should return data", async () => {
    networkSpy.mockResolvedValue({
      data: "mockedData",
    });

    const result = await httpManagerApiRepository.getCurrentFirmware({
      deviceId: 123,
      providerId: 12,
      version: "mockedVersion",
    });

    expect(result).toBe("mockedData");
  });

  test("getFinalFirmwareById should call network() with the correct parameters", async () => {
    await httpManagerApiRepository.getFinalFirmwareById(123).catch(() => {
      // ignore the error in this test case
    });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "GET",
      url: "http://managerApiBase.com/firmware_final_versions/123?livecommonversion=1.2.3",
    });
  });

  test("getFinalFirmwareById should return data", async () => {
    networkSpy.mockResolvedValue({
      data: "mockedData",
    });

    const result = await httpManagerApiRepository.getFinalFirmwareById(123);

    expect(result).toBe("mockedData");
  });

  test("getAppsByHash should call network() with the correct parameters", async () => {
    const mockHashes = ["mockedHash1", "mockedHash2"];
    await httpManagerApiRepository.getAppsByHash(mockHashes).catch(() => {
      // ignore the error in this test case
    });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "POST",
      url: "http://managerApiBase.com/v2/apps/hash?livecommonversion=1.2.3",
      data: mockHashes,
    });
  });

  test("getAppsByHash should throw a NetworkDown error if data is null", async () => {
    networkSpy.mockResolvedValue({
      data: null,
    });

    await expect(httpManagerApiRepository.getAppsByHash(["mockedHash"])).rejects.toThrow(
      NetworkDown,
    );
  });

  test("getAppsByHash should throw a NetworkDown error if data is not an array", async () => {
    networkSpy.mockResolvedValue({
      data: "mockedData",
    });

    await expect(httpManagerApiRepository.getAppsByHash(["mockedHash"])).rejects.toThrow(
      NetworkDown,
    );
  });

  test("getAppsByHash should return data if it's an array", async () => {
    networkSpy.mockResolvedValue({
      data: ["mockedData"],
    });

    const result = await httpManagerApiRepository.getAppsByHash(["mockedHash"]);

    expect(result).toEqual(["mockedData"]);
  });

  test("catalogForDevice should call network() with the correct parameters", async () => {
    await httpManagerApiRepository
      .catalogForDevice({
        targetId: 123,
        provider: 12,
        firmwareVersion: "mockedFirmwareVersion",
      })
      .catch(() => {
        // ignore the error in this test case
      });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "GET",
      url: "http://managerApiBase.com/v2/apps/by-target?livecommonversion=1.2.3&provider=12&target_id=123&firmware_version_name=mockedFirmwareVersion",
    });
  });

  test("catalogForDevice should throw a NetworkDown error if data is null", async () => {
    networkSpy.mockResolvedValue({
      data: null,
    });

    await expect(
      httpManagerApiRepository.catalogForDevice({
        targetId: 123,
        provider: 12,
        firmwareVersion: "mockedFirmwareVersion",
      }),
    ).rejects.toThrow(NetworkDown);
  });

  test("catalogForDevice should throw a NetworkDown error if data is not an array", async () => {
    networkSpy.mockResolvedValue({
      data: "mockedData",
    });

    await expect(
      httpManagerApiRepository.catalogForDevice({
        targetId: 123,
        provider: 12,
        firmwareVersion: "mockedFirmwareVersion",
      }),
    ).rejects.toThrow(NetworkDown);
  });

  test("catalogForDevice should return data if it's an array", async () => {
    networkSpy.mockResolvedValue({
      data: ["mockedData"],
    });

    const result = await httpManagerApiRepository.catalogForDevice({
      targetId: 123,
      provider: 12,
      firmwareVersion: "mockedFirmwareVersion",
    });

    expect(result).toEqual(["mockedData"]);
  });

  test("getLanguagePackagesForDevice should call network() and other methods with the correct parameters", async () => {
    const getDeviceVersionSpy = jest
      .spyOn(httpManagerApiRepository, "getDeviceVersion")
      .mockReturnValue(Promise.resolve({ id: 4 } as DeviceVersionEntity));
    const getCurrentFirmwareSpy = jest
      .spyOn(httpManagerApiRepository, "getCurrentFirmware")
      .mockImplementation(jest.fn());

    await httpManagerApiRepository
      .getLanguagePackagesForDevice(
        {
          version: 1,
          targetId: 2,
          id: 3,
        } as unknown as DeviceInfoEntity,
        12,
      )
      .catch(() => {
        // ignore the error in this test case
      });

    expect(getDeviceVersionSpy).toHaveBeenCalledWith({ targetId: 2, providerId: 12 });
    expect(getCurrentFirmwareSpy).toHaveBeenCalledWith({ deviceId: 4, providerId: 12, version: 1 });

    expect(networkSpy).toHaveBeenCalledWith({
      method: "GET",
      url: "http://managerApiBase.com/language-package?livecommonversion=1.2.3",
    });
  });

  test("getLanguagePackagesForDevice should return language packages", async () => {
    const mockedDeviceVersionId = 123;
    const mockedCurrentFirmwareId = 456;

    jest
      .spyOn(httpManagerApiRepository, "getDeviceVersion")
      .mockReturnValue(Promise.resolve({ id: mockedDeviceVersionId } as DeviceVersionEntity));
    jest
      .spyOn(httpManagerApiRepository, "getCurrentFirmware")
      .mockReturnValue(Promise.resolve({ id: mockedCurrentFirmwareId } as FinalFirmware));

    networkSpy.mockResolvedValue({
      data: [
        {
          language: "french",
          language_package_version: [
            {
              device_versions: [mockedDeviceVersionId, 8888],
              language: "french",
              se_firmware_final_versions: [mockedCurrentFirmwareId, 9999],
            } as LanguagePackageEntity,
          ],
        },
        {
          language: "spanish",
          language_package_version: [
            {
              device_versions: [mockedDeviceVersionId],
              language: "spanish",
              se_firmware_final_versions: [9999], // this excludes the package from the result
            } as LanguagePackageEntity,
          ],
        },
        {
          language: "english",
          language_package_version: [
            {
              device_versions: [8888], // this excludes the package from the result
              language: "spanish",
              se_firmware_final_versions: [mockedCurrentFirmwareId],
            } as LanguagePackageEntity,
          ],
        },
      ] as LanguagePackageResponseEntity[],
    });

    const result = await httpManagerApiRepository.getLanguagePackagesForDevice(
      {} as unknown as DeviceInfoEntity,
    );

    expect(result).toEqual([
      {
        device_versions: [mockedDeviceVersionId, 8888],
        language: "french",
        se_firmware_final_versions: [mockedCurrentFirmwareId, 9999],
      },
    ]);
  });
});
