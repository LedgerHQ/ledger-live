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
  let restoreAppDataFnMock: jest.Mock;

  it("should transfer the events when backup data found", done => {
    restoreAppDataFnMock = jest.fn().mockImplementation(() => {
      return new Observable(subscriber => {
        subscriber.next({
          type: RestoreAppDataEventType.AppDataInitialized,
        });
        subscriber.next({
          type: RestoreAppDataEventType.Progress,
          data: 0.25,
        });
        subscriber.next({
          type: RestoreAppDataEventType.AppDataRestored,
        });
        subscriber.complete();
      });
    });

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

    const events: RestoreAppDataEvent[] = [];

    restoreAppDataUseCase(
      appName,
      deviceModelId,
      storageProviderMock,
      restoreAppDataFnMock,
    ).subscribe({
      next: event => {
        events.push(event);
      },
      complete: () => {
        try {
          expect(events).toHaveLength(expectedEvents.length);
          expect(events).toEqual(expectedEvents);
          done();
        } catch (e) {
          done(e);
        }
      },
      error: (e: Error) => {
        done(e);
      },
    });
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
