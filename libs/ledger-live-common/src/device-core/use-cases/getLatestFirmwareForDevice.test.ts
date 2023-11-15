import { getLatestFirmwareForDevice } from "./getLatestFirmwareForDevice";
import { ManagerApiRepository } from "../repositories/ManagerApiRepository";
import { DeviceInfoEntity } from "../entities/DeviceInfoEntity";
jest.mock("../repositories/ManagerApiRepository");

describe("getLatestFirmwareForDevice", () => {
  let managerApiRepository: ManagerApiRepository;

  beforeEach(() => {
    managerApiRepository = new ManagerApiRepository("", "");
  });

  test("Error throw for unknown mcu", async () => {
    // given
    const deviceInfo = { mcuVersion: "42" } as DeviceInfoEntity;
    jest.spyOn(managerApiRepository, "fetchMcus").mockResolvedValue([]);
    const params = {
      deviceInfo,
      providerId: 42,
      userId: "",
      managerApiRepository,
    };
    // when
    const response = getLatestFirmwareForDevice(params);
    // then
    expect(response).rejects.toContain({ name: "UnknownMCU" });
  });
});
