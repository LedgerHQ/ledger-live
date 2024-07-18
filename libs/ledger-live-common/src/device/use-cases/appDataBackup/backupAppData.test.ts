import Transport from "@ledgerhq/hw-transport";
import { Observable, firstValueFrom, lastValueFrom } from "rxjs";
import { backupAppData } from "./backupAppData";
import { BackupAppDataError, BackupAppDataEvent, BackupAppDataEventType } from "./types";
import * as deviceCore from "@ledgerhq/device-core";

jest.mock("@ledgerhq/hw-transport");
jest.mock("@ledgerhq/device-core", () => ({
  isAppStorageInfo: jest.fn().mockResolvedValue(true),
  getAppStorageInfo: jest.fn().mockResolvedValue({
    size: 6,
    dataVersion: "test",
    hasSettings: true,
    hasData: true,
    hash: "test",
  }),
  backupAppStorage: jest.fn().mockResolvedValue(Buffer.from("ledger")),
}));

describe("backupAppData", () => {
  let transport: Transport;
  let appName: string;

  beforeEach(() => {
    // Initialize the transport and app name before each test
    transport = {} as unknown as Transport;
    appName = "MyApp";
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should backup the app data by emitting relative events sequentially", async () => {
    const backupObservable: Observable<BackupAppDataEvent> = backupAppData(transport, appName);
    const events: BackupAppDataEvent[] = [];

    // Subscribe to the observable to receive the backup events
    backupObservable.subscribe((event: BackupAppDataEvent) => {
      events.push(event);
    });

    const firstValue: BackupAppDataEvent = await firstValueFrom(backupObservable);
    expect(firstValue).toEqual({
      type: BackupAppDataEventType.AppDataInfoFetched,
      data: { size: 6, dataVersion: "test", hasSettings: true, hasData: true, hash: "test" },
    });

    const lastValue: BackupAppDataEvent = await lastValueFrom(backupObservable);
    expect(lastValue).toEqual({
      type: BackupAppDataEventType.AppDataBackedUp,
      data: "bGVkZ2Vy", // base64 encoded "ledger"
    });

    expect(events).toContainEqual({
      type: BackupAppDataEventType.Progress,
      data: expect.any(Number),
    });

    expect(events).toHaveLength(3);
  });

  it("should emit specific event when data size is zero", async () => {
    // Mock the getAppStorageInfo function to return an app data size of 0
    jest.spyOn(deviceCore, "getAppStorageInfo").mockResolvedValue({
      size: 0,
      dataVersion: "test",
      hasSettings: false,
      hasData: false,
      hash: "test",
    });

    const backupObservable: Observable<BackupAppDataEvent> = backupAppData(transport, appName);
    const events: BackupAppDataEvent[] = [];

    // Subscribe to the observable to receive the backup events
    backupObservable.subscribe((event: BackupAppDataEvent) => {
      events.push(event);
    });

    const firstValue: BackupAppDataEvent = await firstValueFrom(backupObservable);
    expect(firstValue).toEqual({
      type: BackupAppDataEventType.AppDataInfoFetched,
      data: { size: 0, dataVersion: "test", hasSettings: false, hasData: false, hash: "test" },
    });

    const lastValue: BackupAppDataEvent = await lastValueFrom(backupObservable);
    expect(lastValue).toEqual({
      type: BackupAppDataEventType.NoAppDataToBackup,
    });

    expect(events).toHaveLength(2);
  });

  it("should throw an error when the chunk data is empty", async () => {
    jest.spyOn(deviceCore, "backupAppStorage").mockResolvedValue(Buffer.from(""));

    const backupObservable: Observable<BackupAppDataEvent> = backupAppData(transport, appName);
    lastValueFrom(backupObservable).catch(e => {
      expect(e).toBeInstanceOf(BackupAppDataError);
      expect(e.message).toBe("Chunk data is empty");
    });
  });

  it("should throw an error when the app data size mismatch", async () => {
    jest.spyOn(deviceCore, "getAppStorageInfo").mockResolvedValue({
      size: 5,
      dataVersion: "test",
      hasSettings: true,
      hasData: true,
      hash: "test",
    });
    jest.spyOn(deviceCore, "backupAppStorage").mockResolvedValue(Buffer.from("ledger"));

    const backupObservable: Observable<BackupAppDataEvent> = backupAppData(transport, appName);
    lastValueFrom(backupObservable).catch(e => {
      expect(e).toBeInstanceOf(BackupAppDataError);
      expect(e.message).toBe("App data size mismatch");
    });
  });
});
