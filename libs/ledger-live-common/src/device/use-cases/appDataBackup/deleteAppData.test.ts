import { Observable, firstValueFrom, lastValueFrom } from "rxjs";
import { deleteAppData } from "./deleteAppData";
import {
  AppStorageType,
  DeleteAppDataError,
  DeleteAppDataEvent,
  DeleteAppDataEventType,
  StorageProvider,
} from "./types";
import { DeviceModelId } from "@ledgerhq/devices";

jest.mock("@ledgerhq/hw-transport");

describe("deleteAppData", () => {
  let appName: string;
  let deviceModelId: DeviceModelId;
  let storageProvider: StorageProvider<AppStorageType>;

  const setItem = jest.fn();
  const getItem = jest.fn();
  const removeItem = jest.fn();

  beforeEach(() => {
    appName = "MyApp";
    deviceModelId = DeviceModelId.stax;
    storageProvider = {
      getItem,
      setItem,
      removeItem,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("success case", () => {
    it("should delete the app data by emitting relative events sequentially", async () => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );
      const events: DeleteAppDataEvent[] = [];

      getItem.mockResolvedValue({
        appDataInfo: {
          size: 6,
          dataVersion: "test",
          hasSettings: true,
          hasData: true,
          hash: "test",
        },
        appData: "bGVkZ2Vy", // base64 encoded "ledger"
      });

      removeItem.mockResolvedValue(undefined);

      // Subscribe to the observable to receive the delete events
      deleteObservable.subscribe((event: DeleteAppDataEvent) => {
        events.push(event);
      });

      const firstValue: DeleteAppDataEvent = await firstValueFrom(deleteObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      const lastValue: DeleteAppDataEvent = await lastValueFrom(deleteObservable);
      expect(lastValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleted,
      });

      expect(events).toHaveLength(2);
    });

    it("should emit specific event when there is no app data to delete", async () => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );
      const events: DeleteAppDataEvent[] = [];

      getItem.mockResolvedValue(null);

      // Subscribe to the observable to receive the delete events
      deleteObservable.subscribe((event: DeleteAppDataEvent) => {
        events.push(event);
      });

      const firstValue: DeleteAppDataEvent = await firstValueFrom(deleteObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      const lastValue: DeleteAppDataEvent = await lastValueFrom(deleteObservable);
      expect(lastValue).toEqual({
        type: DeleteAppDataEventType.NoAppDataToDelete,
      });

      expect(events).toHaveLength(2);
    });
  });

  describe("error case", () => {
    it("should emit an error event when there is an error during the deletion process", async () => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );

      const events: DeleteAppDataEvent[] = [];

      getItem.mockResolvedValue({
        appDataInfo: {
          size: 6,
          dataVersion: "test",
          hasSettings: true,
          hasData: true,
          hash: "test",
        },
        appData: "bGVkZ2Vy", // base64 encoded "ledger"
      });

      removeItem.mockRejectedValue(new Error("Failed to delete app data"));

      // Subscribe to the observable to receive the delete events
      deleteObservable.subscribe((event: DeleteAppDataEvent) => {
        events.push(event);
      });

      const firstValue: DeleteAppDataEvent = await firstValueFrom(deleteObservable);
      expect(firstValue).toEqual({
        type: DeleteAppDataEventType.AppDataDeleteStarted,
      });

      lastValueFrom(deleteObservable).catch(e => {
        expect(e).toBeInstanceOf(DeleteAppDataError);
        expect(e.message).toBe("Failed to delete app data");
      });

      expect(events).toHaveLength(1);
    });

    it("should emit an error event when there is an error getting the app data from storage", async () => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );

      getItem.mockRejectedValue(new Error("Error fetching app data"));

      lastValueFrom(deleteObservable).catch(e => {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe("Error fetching app data");
      });
    });

    it("should emit an error event when there is an unkown error getting the app data from storage", async () => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );

      getItem.mockRejectedValue(null);

      lastValueFrom(deleteObservable).catch(e => {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toBe("Unknown error");
      });
    });
  });
});
