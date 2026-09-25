import type { AllureTestRunMetadata, AllureTestFileMetadata, MaybeFunction } from '@support/jest-allure2-reporter';
import Handlebars from 'handlebars';
import { AllureMetadataProxy, AllureTestItemMetadataProxy } from '../metadata';
import type { AllureRuntimeConfig } from './AllureRuntimeConfig';
import type { ContentAttachmentHandler, FileAttachmentHandler, MIMEInferer, SharedReporterConfig } from './types';
export declare class AllureRuntimeContext {
    readonly contentAttachmentHandlers: Record<string, ContentAttachmentHandler>;
    readonly fileAttachmentHandlers: Record<string, FileAttachmentHandler>;
    readonly handlebars: typeof Handlebars;
    readonly inferMimeType: MIMEInferer;
    readonly getReporterConfig: () => SharedReporterConfig;
    readonly getFileMetadata: () => AllureMetadataProxy<AllureTestFileMetadata>;
    readonly getGlobalMetadata: () => AllureMetadataProxy<AllureTestRunMetadata>;
    readonly getCurrentMetadata: () => AllureTestItemMetadataProxy;
    readonly getNow: () => number;
    readonly flush: () => Promise<unknown>;
    readonly enqueueTask: <T>(task: MaybeFunction<Promise<T>>) => Promise<T>;
    constructor(config: AllureRuntimeConfig);
}
