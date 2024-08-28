import { concat, firstValueFrom, lastValueFrom, Observable, of, throwError } from "rxjs";
import { DeviceModelId } from "@ledgerhq/devices";
import {
  AppStorageType,
  DeleteAppDataError,
  DeleteAppDataEvent,
  DeleteAppDataEventType,
  StorageProvider,
} from "./types";
import { deleteAppDataUseCase } from "./deleteAppDataUseCase";

describe("deleteAppDataUseCase", () => {
  let appName: string;
  let deviceModelId: DeviceModelId;
  let storageProvider: StorageProvider<AppStorageType>;

  const setItem = jest.fn();
  const getItem = jest.fn();
  const removeItem = jest.fn();
  const deleteAppDataFn = jest.fn();

  beforeEach(() => {
    appName = "MyApp";
    deviceModelId = DeviceModelId.stax;
    storageProvider = {
      setItem,
      getItem,
      removeItem,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("success cases", () => {
    it("should emit the correct events when the app data is deleted", async () => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          of({
            type: DeleteAppDataEventType.AppDataDeleted,
          }),
        ),
      );

      const deleteAppDataUseCaseObservable: Observable<DeleteAppDataEvent> = deleteAppDataUseCase(
        appName,
        deviceModelId,
        storageProvider,
        deleteAppDataFn,
      );

      const firstValue = await firstValueFrom(deleteAppDataUseCaseObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      const secondValue = await lastValueFrom(deleteAppDataUseCaseObservable);
      expect(secondValue).toEqual({ type: DeleteAppDataEventType.AppDataDeleted });
    });

    it("should emit the correct events when the app data is not found", async () => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          of({
            type: DeleteAppDataEventType.NoAppDataToDelete,
          }),
        ),
      );

      const deleteAppDataUseCaseObservable: Observable<DeleteAppDataEvent> = deleteAppDataUseCase(
        appName,
        deviceModelId,
        storageProvider,
        deleteAppDataFn,
      );

      const firstValue = await firstValueFrom(deleteAppDataUseCaseObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      const secondValue = await lastValueFrom(deleteAppDataUseCaseObservable);
      expect(secondValue).toEqual({ type: DeleteAppDataEventType.NoAppDataToDelete });
    });
  });

  describe("error cases", () => {
    it("should emit the correct events when there is an error deleting the app data", async () => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          throwError(() => new DeleteAppDataError("Error deleting app data")),
        ),
      );

      const deleteAppDataUseCaseObservable: Observable<DeleteAppDataEvent> = deleteAppDataUseCase(
        appName,
        deviceModelId,
        storageProvider,
        deleteAppDataFn,
      );

      const firstValue = await firstValueFrom(deleteAppDataUseCaseObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      lastValueFrom(deleteAppDataUseCaseObservable).catch(error => {
        expect(error).toBeInstanceOf(DeleteAppDataError);
        expect(error.message).toBe("Error deleting app data");
      });
    });

    it("should emit the correct events when there is an error getting the app data", async () => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          throwError(() => new DeleteAppDataError("Error getting app data")),
        ),
      );

      const deleteAppDataUseCaseObservable: Observable<DeleteAppDataEvent> = deleteAppDataUseCase(
        appName,
        deviceModelId,
        storageProvider,
        deleteAppDataFn,
      );

      const firstValue = await firstValueFrom(deleteAppDataUseCaseObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      lastValueFrom(deleteAppDataUseCaseObservable).catch(error => {
        expect(error).toBeInstanceOf(DeleteAppDataError);
        expect(error.message).toBe("Error getting app data");
      });
    });

    it("should emit the correct events when there is an unknown error", async () => {
      deleteAppDataFn.mockReturnValue(
        concat(
          of({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          }),
          throwError(() => new Error("Unknown error")),
        ),
      );

      const deleteAppDataUseCaseObservable: Observable<DeleteAppDataEvent> = deleteAppDataUseCase(
        appName,
        deviceModelId,
        storageProvider,
        deleteAppDataFn,
      );

      const firstValue = await firstValueFrom(deleteAppDataUseCaseObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      lastValueFrom(deleteAppDataUseCaseObservable).catch(error => {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Unknown error");
      });
    });
  });
});
