import type { AllureRuntime } from '@support/jest-allure2-reporter/api';
import type { DetoxAllure2AdapterDeviceLogsOptions, OnErrorHandlerFn } from '../types';
import { type DeviceWrapper } from '../utils';
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
export declare class LogBuffer implements StepLogRecorder {
    readonly _config: LogBufferOptions;
    private readonly _emitter;
    private readonly _appEntries;
    private readonly _detoxEntries;
    private readonly _options;
    private readonly _deferreds;
    private readonly _syncDelay;
    private readonly _errorHandler;
    constructor(_config: LogBufferOptions);
    setPid(pid: number): void;
    close(): Promise<void>;
    attachBefore(allure: AllureRuntime): void;
    attachAfter(allure: AllureRuntime, failed: boolean): Promise<void>;
    attachAfterSuccess(allure: AllureRuntime): Promise<void>;
    attachAfterFailure(allure: AllureRuntime): Promise<void>;
    private _synchronize;
    private readonly _attachLogs;
    private _updateDeferreds;
    private readonly _onEntry;
    private _iosFilter;
    private _androidFilter;
    private readonly _defaultIosFilter;
    private readonly _defaultAndroidFilter;
    private _inferSyncDelay;
}
