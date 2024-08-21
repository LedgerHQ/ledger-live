import { Observable, firstValueFrom, of } from "rxjs";
import { RestoreAppDataError, RestoreAppDataEvent, RestoreAppDataEventType } from "./types";
import { DeviceModelId } from "@ledgerhq/devices";
import { restoreAppDataUseCase } from "./restoreAppDataUseCase";

describe("restoreAppDataUseCase", () => {
  const storageProviderMock = {
    getItem: jest.fn().mockReturnValue(Promise.resolve("data")),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
  const appName = "MyApp";
  const deviceModelId = DeviceModelId.stax;

  it("should transfer the events when backup data found", async () => {
    const expectedEvents: RestoreAppDataEvent[] = [
      {
        type: RestoreAppDataEventType.AppDataInitialized,
      },
      {
        type: RestoreAppDataEventType.Progress,
        data: 0.25,
      },
      {
        type: RestoreAppDataEventType.AppDataRestored,
      },
    ];
    for (const event of expectedEvents) {
      const restoreAppDataFnMock = jest.fn(_ => of(event));
      const restoreAppDataUseCaseObservable: Observable<RestoreAppDataEvent> =
        restoreAppDataUseCase(appName, deviceModelId, storageProviderMock, restoreAppDataFnMock);
      const firstValue = await firstValueFrom(restoreAppDataUseCaseObservable);
      expect(firstValue).toEqual(event);
    }
  });

  it("should throw an error when backup data not found", async () => {
    const restoreAppDataFnMock = jest.fn(() => of({} as RestoreAppDataEvent));
    jest.spyOn(storageProviderMock, "getItem").mockResolvedValue(null);

    const restoreAppDataUseCaseObservable: Observable<RestoreAppDataEvent> = restoreAppDataUseCase(
      appName,
      deviceModelId,
      storageProviderMock,
      restoreAppDataFnMock,
    );

    await firstValueFrom(restoreAppDataUseCaseObservable).catch(e => {
      expect(e).toBeInstanceOf(RestoreAppDataError);
      expect(e.message).toBe("No backed up data found");
    });
  });
});
