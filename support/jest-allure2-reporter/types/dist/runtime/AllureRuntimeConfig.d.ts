import type { GlobalMetadata, Metadata, TestFileMetadata } from 'jest-metadata';
import type { ContentAttachmentHandler, FileAttachmentHandler, MIMEInferer, SharedReporterConfig } from './types';
export interface AllureRuntimeConfig {
    readonly contentAttachmentHandlers?: Record<string, ContentAttachmentHandler>;
    readonly fileAttachmentHandlers?: Record<string, FileAttachmentHandler>;
    readonly inferMimeType?: MIMEInferer;
    getReporterConfig(): SharedReporterConfig;
    getCurrentMetadata(): Metadata;
    getFileMetadata(): TestFileMetadata;
    getGlobalMetadata(): GlobalMetadata;
    getNow(): number;
}
