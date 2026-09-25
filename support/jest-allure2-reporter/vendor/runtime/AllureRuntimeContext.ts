import type {
  AllureTestRunMetadata,
  AllureTestFileMetadata,
  MaybeFunction,
} from '@support/jest-allure2-reporter';
import Handlebars from 'handlebars';

import { once, TaskQueue } from '../utils';
import { AllureMetadataProxy, AllureTestItemMetadataProxy } from '../metadata';
import { log } from '../logger';

import type { AllureRuntimeConfig } from './AllureRuntimeConfig';
import * as attachmentHandlers from './attachment-handlers';
import type {
  ContentAttachmentHandler,
  FileAttachmentHandler,
  MIMEInferer,
  SharedReporterConfig,
} from './types';

export class AllureRuntimeContext {
  readonly contentAttachmentHandlers: Record<string, ContentAttachmentHandler>;
  readonly fileAttachmentHandlers: Record<string, FileAttachmentHandler>;
  readonly handlebars = Handlebars.create();
  readonly inferMimeType: MIMEInferer;
  readonly getReporterConfig: () => SharedReporterConfig;
  readonly getFileMetadata: () => AllureMetadataProxy<AllureTestFileMetadata>;
  readonly getGlobalMetadata: () => AllureMetadataProxy<AllureTestRunMetadata>;
  readonly getCurrentMetadata: () => AllureTestItemMetadataProxy;
  readonly getNow: () => number;

  readonly flush: () => Promise<unknown>;
  readonly enqueueTask: <T>(task: MaybeFunction<Promise<T>>) => Promise<T>;

  constructor(config: AllureRuntimeConfig) {
    this.contentAttachmentHandlers = config.contentAttachmentHandlers ?? {
      write: attachmentHandlers.writeHandler,
    };
    this.fileAttachmentHandlers = config.fileAttachmentHandlers ?? {
      copy: attachmentHandlers.copyHandler,
      move: attachmentHandlers.moveHandler,
      ref: attachmentHandlers.referenceHandler,
    };
    this.inferMimeType = config.inferMimeType ?? attachmentHandlers.inferMimeType;
    this.getNow = config.getNow;
    this.getReporterConfig = once(config.getReporterConfig);
    this.getCurrentMetadata = () => new AllureTestItemMetadataProxy(config.getCurrentMetadata());
    this.getFileMetadata = () => new AllureMetadataProxy(config.getFileMetadata());
    this.getGlobalMetadata = () => new AllureMetadataProxy(config.getGlobalMetadata());

    const taskQueue = new TaskQueue({
      logError(error) {
        log.error(error, 'Allure Runtime Task Queue Error');
      },
    });

    this.flush = taskQueue.flush;
    this.enqueueTask = taskQueue.enqueueTask;

    Object.defineProperty(this.contentAttachmentHandlers, 'default', {
      get: () => {
        const defaultName = this.getReporterConfig().attachments.contentHandler;
        return this.contentAttachmentHandlers[defaultName];
      },
    });

    Object.defineProperty(this.fileAttachmentHandlers, 'default', {
      get: () => {
        const defaultName = this.getReporterConfig().attachments.fileHandler;
        return this.fileAttachmentHandlers[defaultName];
      },
    });
  }
}
