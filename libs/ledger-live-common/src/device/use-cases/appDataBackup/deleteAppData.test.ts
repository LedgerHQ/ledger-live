import { Observable } from "rxjs";
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
    it("should delete the app data by emitting relative events sequentially", done => {
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

      deleteObservable.subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          expect(events).toHaveLength(2);
          expect(events[0]).toEqual({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          });
          expect(events[1]).toEqual({
            type: DeleteAppDataEventType.AppDataDeleted,
          });
          done();
        },
        error: (e: Error) => {
          done(e);
        },
      });
    });

    it("should emit specific event when there is no app data to delete", done => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );
      const events: DeleteAppDataEvent[] = [];

      getItem.mockResolvedValue(null);

      deleteObservable.subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          expect(events).toHaveLength(2);
          expect(events[0]).toEqual({
            type: DeleteAppDataEventType.AppDataDeleteStarted,
          });
          expect(events[1]).toEqual({
            type: DeleteAppDataEventType.NoAppDataToDelete,
          });
          done();
        },
        error: (e: Error) => {
          done(e);
        },
      });
    });
  });

  describe("error case", () => {
    it("should emit an error event when there is an error during the deletion process", done => {
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
      deleteObservable.subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          done(new Error("Complete should not be called"));
        },
        error: (e: Error) => {
          try {
            expect(events).toHaveLength(1);
            expect(events[0]).toEqual({
              type: DeleteAppDataEventType.AppDataDeleteStarted,
            });
            expect(e).toBeInstanceOf(DeleteAppDataError);
            expect(e.message).toBe("Failed to delete app data");
            done();
          } catch (error) {
            done(error);
          }
        },
      });
    });

    it("should emit an error event when there is an error getting the app data from storage", done => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );

      getItem.mockRejectedValue(new Error("Error fetching app data"));

      const events: DeleteAppDataEvent[] = [];

      deleteObservable.subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          done(new Error("Complete should not be called"));
        },
        error: (e: Error) => {
          try {
            expect(events).toHaveLength(1);
            expect(events[0]).toEqual({
              type: DeleteAppDataEventType.AppDataDeleteStarted,
            });
            expect(e).toEqual(new Error("Error fetching app data"));
            done();
          } catch (error) {
            done(error);
          }
        },
      });
    });

    it("should emit an error event when there is an unkown error getting the app data from storage", done => {
      const deleteObservable: Observable<DeleteAppDataEvent> = deleteAppData(
        appName,
        deviceModelId,
        storageProvider,
      );

      getItem.mockRejectedValue(null);

      const events: DeleteAppDataEvent[] = [];

      deleteObservable.subscribe({
        next: (event: DeleteAppDataEvent) => events.push(event),
        complete: () => {
          done(new Error("Complete should not be called"));
        },
        error: (e: Error) => {
          try {
            expect(e).toEqual(new Error("Unknown error"));
            done();
          } catch (error) {
            done(error);
          }
        },
      });
    });
  });
});
