// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from "@support/jest-allure2-reporter/api";

import type { Emitter, AndroidEntry, IosEntry } from "logkitten";
import { Level, logkitten } from "logkitten";
import type {
  DetoxAllure2AdapterDeviceLogsOptions,
  OnErrorHandlerFn,
} from "../types";
import { Deferred, type DeviceWrapper } from "../utils";

import { PIDEntryCollection } from "./pid-entry-collection";

type AnyEntry = AndroidEntry & IosEntry;

export interface LogBufferOptions {
  device: DeviceWrapper;
  options: true | DetoxAllure2AdapterDeviceLogsOptions;
  onError: OnErrorHandlerFn;
}

export interface StepLogRecorder {
  attachBefore(allure: AllureRuntime): void;
  attachAfter(allure: AllureRuntime, failed: boolean): Promise<void>;
  attachAfterSuccess(allure: AllureRuntime): Promise<void>;
  attachAfterFailure(allure: AllureRuntime): Promise<void>;
  setPid(pid: number): void;
  close(): Promise<void>;
}

const DEFAULT_SYNC_DELAY = 500;

export class LogBuffer implements StepLogRecorder {
  private readonly _emitter: Emitter;
  private readonly _appEntries = new PIDEntryCollection();
  private readonly _detoxEntries = new PIDEntryCollection();
  private readonly _options: DetoxAllure2AdapterDeviceLogsOptions;
  private readonly _deferreds = new Set<Deferred<number>>();
  private readonly _syncDelay: number;
  private readonly _errorHandler: OnErrorHandlerFn;

  constructor(readonly _config: LogBufferOptions) {
    const deviceId = this._config.device.id;
    const platform = this._config.device.platform;

    this._options =
      typeof this._config.options === "boolean" ? {} : this._config.options;
    this._syncDelay = this._inferSyncDelay(platform, this._config.options);
    this._errorHandler = this._config.onError;
    this._emitter =
      platform === "android"
        ? logkitten({
            platform: "android",
            deviceId,
            adbPath: this._config.device.adbPath,
            filter: this._androidFilter.bind(this),
          })
        : logkitten({
            platform: "ios",
            deviceId,
            filter: this._iosFilter.bind(this),
          });

    this._emitter.on("entry", this._onEntry);
    this._emitter.on("error", this._errorHandler);
  }

  public setPid(pid: number) {
    this._appEntries.pid = pid;
    this._detoxEntries.pid = pid;
  }

  public async close() {
    await this._emitter.close();
    this._emitter.removeAllListeners();
  }

  public attachBefore(allure: AllureRuntime) {
    return this._attachLogs(allure, false, false);
  }

  public async attachAfter(allure: AllureRuntime, failed: boolean) {
    await this._synchronize();
    return this._attachLogs(allure, failed, true);
  }

  public async attachAfterSuccess(allure: AllureRuntime) {
    await this._synchronize();
    return this._attachLogs(allure, false, true);
  }

  public async attachAfterFailure(allure: AllureRuntime) {
    await this._synchronize();
    return this._attachLogs(allure, true, true);
  }

  private _synchronize(reference = Date.now()): Promise<void> {
    if (this._syncDelay < 1) {
      return Promise.resolve();
    }

    const deferred = new Deferred<number>({
      timeoutMs: this._syncDelay,
      predicate: (ts) => ts > reference,
      cleanup: () => {
        this._deferreds.delete(deferred);
      },
    });
    this._deferreds.add(deferred);
    return deferred.promise.then(() => {}); // resolve to void
  }

  private readonly _attachLogs = (
    allure: AllureRuntime,
    failed: boolean,
    after: boolean
  ) => {
    const saveAll = this._options.saveAll ?? false;
    const appContent = this._appEntries.flushAsString();
    const detoxContent = this._detoxEntries.flushAsString();
    if (!saveAll && !failed) {
      return;
    }

    if (appContent) {
      const name = after ? "app.log" : "app-before.log";
      allure.attachment(name, appContent, "text/plain");
    }

    if (detoxContent) {
      const name = after ? "detox.log" : "detox-before.log";
      allure.attachment(name, detoxContent, "text/plain");
    }
  };

  private _updateDeferreds(ts: number) {
    for (const deferred of this._deferreds) {
      deferred.update(ts);
    }
  }

  private readonly _onEntry = (entry: AnyEntry) => {
    this._appEntries.push(entry);
  };

  private _iosFilter(entry: IosEntry): boolean {
    this._updateDeferreds(entry.ts);

    if (entry.subsystem === "com.wix.Detox") {
      this._detoxEntries.push(entry);

      // Exclude Detox logs from app logs unless they are errors
      if (entry.level < Level.ERROR) {
        return false;
      }
    }

    const userFilter = this._options.ios;
    const override = this._options.override;
    if (!override && !this._defaultIosFilter(entry)) {
      return false;
    }

    return userFilter?.(entry) ?? true;
  }

  private _androidFilter(entry: AndroidEntry): boolean {
    this._updateDeferreds(entry.ts);

    if (entry.tag && entry.tag.startsWith("Detox")) {
      this._detoxEntries.push(entry);

      // Exclude Detox logs from app logs unless they are errors
      if (entry.level < Level.ERROR) {
        return false;
      }
    }

    const userFilter = this._options.android;
    const override = this._options.override;
    if (!override && !this._defaultAndroidFilter(entry)) {
      return false;
    }

    return userFilter?.(entry) ?? true;
  }

  private readonly _defaultIosFilter = (entry: IosEntry) => {
    // Only handle React Native app logs, not Detox logs
    if (entry.subsystem.startsWith("com.facebook.react.")) {
      if (entry.msg.startsWith("Unbalanced calls start/end for tag")) {
        return false;
      }

      return true;
    }

    if (entry.processImagePath.endsWith("/proactiveeventtrackerd")) {
      return false;
    }

    if (entry.level >= Level.ERROR) {
      return !entry.subsystem.startsWith("com.apple."); // && !entry.msg.includes('(CFNetwork)');
    }

    return false;
  };

  private readonly _defaultAndroidFilter = (entry: AndroidEntry) => {
    // Only handle React Native app logs, not Detox logs
    if (entry.tag.startsWith("React")) {
      return true;
    }

    if (entry.level >= Level.ERROR) {
      return true;
    }

    return false;
  };

  /**
   * Infers the sync delay (ms) for the given platform and options.
   */
  private _inferSyncDelay(
    platform: string,
    options: DetoxAllure2AdapterDeviceLogsOptions | boolean
  ): number {
    if (typeof options !== "boolean") {
      const syncDelay = options.syncDelay;
      if (typeof syncDelay === "number") {
        return syncDelay;
      } else if (typeof syncDelay === "object" && syncDelay !== null) {
        return (
          syncDelay[platform as keyof typeof syncDelay] ?? DEFAULT_SYNC_DELAY
        );
      }
    }

    return DEFAULT_SYNC_DELAY;
  }
}
