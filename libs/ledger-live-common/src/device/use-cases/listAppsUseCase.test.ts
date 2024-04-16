import { enableListAppsV2, listAppsUseCase } from "./listAppsUseCase";
import Transport from "@ledgerhq/hw-transport";
import { DeviceInfo } from "@ledgerhq/types-live";

const listAppsV2Module = jest.requireActual("../../apps/listApps/v2");
const listAppsV1Module = jest.requireActual("../../apps/listApps/v1");

describe("listAppsUseCase", () => {
  let listAppsV1Spy: jest.SpyInstance;
  let listAppsV2Spy: jest.SpyInstance;
  beforeEach(() => {
    jest.restoreAllMocks();
    enableListAppsV2(false);
    listAppsV1Spy = jest.spyOn(listAppsV1Module, "listApps").mockImplementation(jest.fn());
    listAppsV2Spy = jest.spyOn(listAppsV2Module, "listApps").mockImplementation(jest.fn());
  });

  it("should call listAppsV2 when enableListAppsV2 is called with true", () => {
    enableListAppsV2(true);

    listAppsUseCase({} as Transport, {} as DeviceInfo);

    expect(listAppsV1Spy).not.toHaveBeenCalled();
    expect(listAppsV2Spy).toHaveBeenCalled();
  });

  it("should call listAppsV1 when enableListAppsV2 is called with false", () => {
    enableListAppsV2(false);

    listAppsUseCase({} as Transport, {} as DeviceInfo);

    expect(listAppsV1Spy).toHaveBeenCalled();
    expect(listAppsV2Spy).not.toHaveBeenCalled();
  });
});
