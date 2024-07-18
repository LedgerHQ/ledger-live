import { backupAppDataUseCase } from "./backupAppDataUseCase";
import { Observable, concat, delay, firstValueFrom, lastValueFrom, of } from "rxjs";
import {
  AppStorageType,
  BackupAppDataError,
  BackupAppDataEvent,
  BackupAppDataEventType,
} from "./types";
import { DeviceModelId } from "@ledgerhq/devices";
import { AppStorageInfo } from "@ledgerhq/device-core";

describe("backupAppDataUseCase", () => {
  const storageProviderMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
  const appName = "MyApp";
  const deviceModelId = DeviceModelId.stax;

  it("should transfer the AppDataInfoFetched event when no backup found", async () => {
    const backupAppDataFnMock = jest.fn(() =>
      of({
        type: BackupAppDataEventType.AppDataInfoFetched,
        data: {} as AppStorageInfo,
      } as BackupAppDataEvent),
    );

    const expectedEvent: BackupAppDataEvent = {
      type: BackupAppDataEventType.AppDataInfoFetched,
      data: {} as AppStorageInfo,
    };
    const backupAppDataUseCaseObservable: Observable<BackupAppDataEvent> = backupAppDataUseCase(
      appName,
      deviceModelId,
      storageProviderMock,
      backupAppDataFnMock,
    );
    const firstValue = await firstValueFrom(backupAppDataUseCaseObservable);
    expect(firstValue).toEqual(expectedEvent);
  });

  it("should return AppDataAlreadyBackedUp event when backup found in storage", async () => {
    jest.spyOn(storageProviderMock, "getItem").mockResolvedValue({
      appDataInfo: { hash: "hashfortest" } as AppStorageInfo,
    } as AppStorageType);
    const backupAppDataFnMock = jest.fn(() =>
      of({
        type: BackupAppDataEventType.AppDataInfoFetched,
        data: { hash: "hashfortest" } as AppStorageInfo,
      } as BackupAppDataEvent),
    );

    const expectedEvent: BackupAppDataEvent = {
      type: BackupAppDataEventType.AppDataAlreadyBackedUp,
    };
    const backupAppDataUseCaseObservable: Observable<BackupAppDataEvent> = backupAppDataUseCase(
      appName,
      deviceModelId,
      storageProviderMock,
      backupAppDataFnMock,
    );

    const firstValue = await firstValueFrom(backupAppDataUseCaseObservable);
    expect(firstValue).toEqual(expectedEvent);
  });

  it("should store the app data and return AppDataBackedUp event with empty string as data", async () => {
    const backupAppDataFnMock = jest.fn().mockReturnValue(
      concat(
        of({
          type: BackupAppDataEventType.AppDataInfoFetched,
          data: { size: 100 } as AppStorageInfo,
        } as BackupAppDataEvent),
        of({
          type: BackupAppDataEventType.AppDataBackedUp,
          data: "mockeddatafortest",
        } as BackupAppDataEvent).pipe(delay(3)),
      ),
    );

    const expectedEvent: BackupAppDataEvent = {
      type: BackupAppDataEventType.AppDataBackedUp,
      data: "",
    };
    const backupAppDataUseCaseObservable: Observable<BackupAppDataEvent> = backupAppDataUseCase(
      appName,
      deviceModelId,
      storageProviderMock,
      backupAppDataFnMock,
    );

    // Initial event should be AppDataInfoFetched
    const firstValue = await firstValueFrom(backupAppDataUseCaseObservable);
    expect(firstValue).toEqual({
      type: BackupAppDataEventType.AppDataInfoFetched,
      data: { size: 100 } as AppStorageInfo,
    });

    // test store the app data
    const lastValue = await lastValueFrom(backupAppDataUseCaseObservable);
    expect(storageProviderMock.setItem).toHaveBeenCalledWith("stax-MyApp", {
      appDataInfo: { size: 100 }, // AppStorageInfo stored in previous event
      appData: "mockeddatafortest",
    });
    expect(lastValue).toEqual(expectedEvent);
  });

  it("should throw an error when an invalid event type is received", async () => {
    const backupAppDataFnMock = jest.fn(() =>
      of({
        type: "InvalidEventType" as never,
      } as BackupAppDataEvent),
    );

    const backupAppDataUseCaseObservable: Observable<BackupAppDataEvent> = backupAppDataUseCase(
      appName,
      deviceModelId,
      storageProviderMock,
      backupAppDataFnMock,
    );

    await firstValueFrom(backupAppDataUseCaseObservable).catch(e => {
      expect(e).toBeInstanceOf(BackupAppDataError);
      expect(e.message).toBe("Invalid event type");
    });
  });

  it("should transfer the events when NoAppDataToBackup / Progress event received ", async () => {
    const expectedEvents: BackupAppDataEvent[] = [
      {
        type: BackupAppDataEventType.Progress,
        data: 0.5,
      },
      {
        type: BackupAppDataEventType.Progress,
        data: 0.75,
      },
      {
        type: BackupAppDataEventType.NoAppDataToBackup,
      },
    ];
    for (const event of expectedEvents) {
      const backupAppDataFnMock = jest.fn(() => of(event));
      const backupAppDataUseCaseObservable: Observable<BackupAppDataEvent> = backupAppDataUseCase(
        appName,
        deviceModelId,
        storageProviderMock,
        backupAppDataFnMock,
      );
      const firstValue = await firstValueFrom(backupAppDataUseCaseObservable);
      expect(firstValue).toEqual(event);
    }
  });
});
