import type { AllureRuntime, ContentAttachmentHandler } from '@support/jest-allure2-reporter/api';
import type { ViewHierarchyHandlerFactory } from '../file-handlers';
import type { ScreenshotHelper } from '../screenshots';
import type { OnErrorHandlerFn } from '../types';
import type { DetoxTestFailedResult } from '../utils';
export interface ViewHierarchyHelperConfig {
    createContentHandler: ViewHierarchyHandlerFactory;
    screenshotsHelper: ScreenshotHelper;
    onError: OnErrorHandlerFn;
}
export declare class ViewHierarchyHelper {
    readonly defaultHandler: ContentAttachmentHandler;
    private readonly _screenshotsCollector;
    private readonly _handleError;
    private readonly _createContentHandler;
    constructor({ createContentHandler, screenshotsHelper, onError }: ViewHierarchyHelperConfig);
    attachFromResult(allure: AllureRuntime, result: DetoxTestFailedResult | undefined): Promise<{
        screenshotsAttached: boolean;
        viewHierarchyAttached: boolean;
    }>;
    private attachInteractiveViewHierarchy;
    private attachNativeViewHierarchy;
    private extractPointer;
}
