import type { MaybePromise } from '@support/jest-allure2-reporter';
import { type Function_ } from '../../utils';
import type { AttachmentContent, AttachmentContext, AttachmentHandler, AttachmentOptions, ContentAttachmentContext, ContentAttachmentHandler, ContentAttachmentOptions, FileAttachmentContext, FileAttachmentHandler, FileAttachmentOptions, HandlebarsAPI, MIMEInfererContext } from '../types';
import type { AllureTestItemMetadataProxy } from '../../metadata';
import type { AllureRuntimeContext } from '../AllureRuntimeContext';
type AttachmentsModuleContext<Context extends AttachmentContext, Handler extends AttachmentHandler<Context>> = {
    readonly handlers: Record<string, Handler>;
    readonly handlebars: HandlebarsAPI;
    readonly inferMimeType: (context: MIMEInfererContext) => string | undefined;
    readonly metadata: AllureTestItemMetadataProxy;
    readonly outDir: string;
    readonly waitFor: <T>(promise: Promise<T>) => Promise<T>;
};
declare abstract class AttachmentsModule<Context extends AttachmentContext, Content extends AttachmentContent, Handler extends AttachmentHandler<Context>, Options extends AttachmentOptions<Context>> {
    #private;
    protected readonly context: AttachmentsModuleContext<Context, Handler>;
    constructor(context: AttachmentsModuleContext<Context, Handler>);
    attachment<T extends Content>(content: MaybePromise<T>, options: Options): Promise<string | undefined>;
    createAttachment<T extends Content>(function_: Function_<MaybePromise<T>>, options: Options): typeof function_;
    protected abstract _createMimeContext(name: string, content: Content): MIMEInfererContext;
    protected abstract _createAttachmentContext(context: AttachmentContext): Context;
}
export declare class FileAttachmentsModule extends AttachmentsModule<FileAttachmentContext, string, FileAttachmentHandler, FileAttachmentOptions> {
    static create(context: AllureRuntimeContext): FileAttachmentsModule;
    protected _createMimeContext(_name: string, sourcePath: string): {
        sourcePath: string;
    };
    protected _createAttachmentContext(context: AttachmentContext): {
        name: string;
        mimeType: string;
        outDir: string;
        sourcePath: string;
        content?: AttachmentContent;
    };
}
export declare class ContentAttachmentsModule extends AttachmentsModule<ContentAttachmentContext, AttachmentContent, ContentAttachmentHandler, ContentAttachmentOptions> {
    static create(context: AllureRuntimeContext): ContentAttachmentsModule;
    protected _createMimeContext(name: string, content: AttachmentContent): {
        sourcePath: string;
        content: AttachmentContent;
    };
    protected _createAttachmentContext(context: AttachmentContext): {
        name: string;
        mimeType: string;
        outDir: string;
        sourcePath?: string;
        content: AttachmentContent;
    };
}
export {};
