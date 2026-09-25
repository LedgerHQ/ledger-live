import type { AllureRuntime } from '@support/jest-allure2-reporter/api';
import type { DetoxAllure2AdapterDeviceScreenshotOptions, OnErrorHandlerFn } from '../types';
import type { DeviceWrapper } from '../utils';
export interface ScreenshotHelperConfig {
    device: DeviceWrapper;
    options: true | DetoxAllure2AdapterDeviceScreenshotOptions;
    onError: OnErrorHandlerFn;
}
export declare class ScreenshotHelper {
    private readonly _device;
    private readonly _options;
    private readonly _kitten;
    constructor({ device, options, onError }: ScreenshotHelperConfig);
    attachFailure(allure: AllureRuntime): Promise<void>;
    attachSuccess(allure: AllureRuntime): Promise<void>;
    attach(allure: AllureRuntime, failed: boolean): Promise<void>;
    takeScreenshot(): Promise<string>;
    private _attachScreenshot;
}
