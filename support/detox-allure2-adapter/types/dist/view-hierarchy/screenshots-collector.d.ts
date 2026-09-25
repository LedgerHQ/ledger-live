import type { AllureRuntime } from '@support/jest-allure2-reporter/api';
import type { ScreenshotHelper } from '../screenshots';
import type { OnErrorHandlerFn } from '../types';
export interface ScreenshotsCollectorConfig {
    screenshotsHelper: ScreenshotHelper;
    onError: OnErrorHandlerFn;
}
export declare class ScreenshotsCollector {
    private readonly _screenshotsHelper;
    private readonly _handleError;
    constructor({ screenshotsHelper, onError }: ScreenshotsCollectorConfig);
    getBase64Screenshot(dir?: string): Promise<string | undefined>;
    attachAllScreenshots(allure: AllureRuntime, dirPath?: string): Promise<boolean>;
    private getScreenshotFromDirectory;
    private captureScreenshotWithScreenkitten;
}
