import { getLatestFirmwareForDevice } from "./getLatestFirmwareForDevice";
import { ManagerApiRepository } from "../ManagerApiRepository";
import { UnknownMCU } from "@ledgerhq/errors";
import { StubManagerApiRepository } from "../StubManagerApiRepository";
import { aDeviceInfoBuilder } from "../../types/mocks";
import { DeviceVersion, OsuFirmware } from "../../types";
jest.mock("../ManagerApiRepository");

// TODO: complete this test
describe("getLatestFirmwareForDevice", () => {
  let mockedManagerApiRepository: ManagerApiRepository;

  beforeEach(() => {
    // Clear the methods we are using in our test
    jest.resetAllMocks();
    mockedManagerApiRepository = new StubManagerApiRepository();
  });

  test("Error throw for unknown mcu", async () => {
    // given
    // Using a fixture builder - we could create that for all our entities
    const deviceInfo = aDeviceInfoBuilder({ mcuVersion: "42", isOSU: true });

    jest.spyOn(mockedManagerApiRepository, "fetchMcus").mockResolvedValue([]);
    jest
      .spyOn(mockedManagerApiRepository, "getDeviceVersion")
      .mockResolvedValue({ id: 42 } as DeviceVersion);
    jest.spyOn(mockedManagerApiRepository, "getCurrentOsu").mockResolvedValue({} as OsuFirmware);

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
