import path from 'node:path';
import util from 'node:util';

import type { Parameter } from '@support/jest-allure2-reporter';

import { constant, isObject, typeAssertions } from '../utils';

import type {
  AllureRuntimeBindOptions,
  AllureRuntimePluginCallback,
  AllureRuntime,
  ContentAttachmentOptions,
  FileAttachmentOptions,
} from './types';
import * as runtimeModules from './modules';
import type { AllureRuntimeContext } from './AllureRuntimeContext';

export class AllureRuntimeImplementation implements AllureRuntime {
  readonly #context: AllureRuntimeContext;
  readonly #coreModule: runtimeModules.CoreModule;
  readonly #basicStepsModule: runtimeModules.StepsModule;
  readonly #contentAttachmentsModule: runtimeModules.ContentAttachmentsModule;
  readonly #fileAttachmentsModule: runtimeModules.FileAttachmentsModule;
  readonly #stepsDecorator: runtimeModules.StepsDecorator;

  constructor(context: AllureRuntimeContext) {
    this.#context = context;
    this.#coreModule = runtimeModules.CoreModule.create(context);
    this.#basicStepsModule = runtimeModules.StepsModule.create(context);
    this.#contentAttachmentsModule = runtimeModules.ContentAttachmentsModule.create(context);
    this.#fileAttachmentsModule = runtimeModules.FileAttachmentsModule.create(context);
    this.#stepsDecorator = new runtimeModules.StepsDecorator({
      handlebars: context.handlebars,
      runtime: this,
    });
  }

  $bind = (options?: AllureRuntimeBindOptions): AllureRuntimeImplementation => {
    const { metadata = true, time = false } = options ?? {};

    return new AllureRuntimeImplementation({
      ...this.#context,
      getCurrentMetadata: metadata
        ? constant(this.#context.getCurrentMetadata())
        : this.#context.getCurrentMetadata,
      getNow: time ? constant(this.#context.getNow()) : this.#context.getNow,
    });
  };

  $plug = (callback: AllureRuntimePluginCallback): this => {
    callback({
      runtime: this,
      handlebars: this.#context.handlebars,
      contentAttachmentHandlers: this.#context.contentAttachmentHandlers,
      fileAttachmentHandlers: this.#context.fileAttachmentHandlers,
      inferMimeType: this.#context.inferMimeType,
    });

    return this;
  };

  flush = () => this.#context.flush();

  description: AllureRuntime['description'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.description(value);
  };

  descriptionHtml: AllureRuntime['descriptionHtml'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.descriptionHtml(value);
  };

  displayName: AllureRuntime['displayName'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.displayName(value);
  };

  fullName: AllureRuntime['fullName'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.fullName(value);
  };

  historyId: AllureRuntime['historyId'] = (value) => {
    typeAssertions.assertPrimitive(value);
    this.#coreModule.historyId(value);
  };

  label: AllureRuntime['label'] = (name, value) => {
    typeAssertions.assertString(name, 'name');
    typeAssertions.assertString(value, 'value');
    this.#coreModule.label(name, value);
  };

  link: AllureRuntime['link'] = (url, name, type) => {
    typeAssertions.assertString(url, 'url');
    if (name != null) typeAssertions.assertString(name, 'name');
    if (type != null) typeAssertions.assertString(type, 'type');
    this.#coreModule.link({ name, url, type });
  };

  parameter: AllureRuntime['parameter'] = (name, value, options) => {
    typeAssertions.assertString(name, 'name');

    this.#coreModule.parameter({
      name,
      value: typeof value === 'string' ? value : util.inspect(value),
      ...options,
    });
  };

  parameters: AllureRuntime['parameters'] = (parameters) => {
    typeAssertions.assertNotNullish(parameters);

    for (const [name, value] of Object.entries(parameters)) {
      if (value && typeof value === 'object') {
        const raw = value as Parameter;
        this.#coreModule.parameter({ ...raw, name });
      } else {
        this.parameter(name, value);
      }
    }
  };

  status: AllureRuntime['status'] = (status, statusDetails) => {
    typeAssertions.assertStatus(status);
    this.#coreModule.status(status);
    if (isObject(statusDetails)) {
      this.#coreModule.statusDetails(statusDetails);
    }
  };

  statusDetails: AllureRuntime['statusDetails'] = (statusDetails) => {
    typeAssertions.assertNotNullish(statusDetails);
    this.#coreModule.statusDetails(statusDetails);
  };

  attachment: AllureRuntime['attachment'] = (name, content, maybeOptions) => {
    typeAssertions.assertString(name, 'name');
    typeAssertions.assertAttachmentContent(content, 'content');

    const options = typeof maybeOptions === 'string' ? { mimeType: maybeOptions } : maybeOptions;

    return this.#contentAttachmentsModule.attachment(content, {
      ...options,
      name,
    });
  };

  createAttachment: AllureRuntime['createAttachment'] = (function_, nameOrOptions) => {
    typeAssertions.assertFunction(function_);
    this.#assertNameOrOptions<ContentAttachmentOptions>(nameOrOptions);

    const options =
      typeof nameOrOptions === 'string' ? { name: nameOrOptions } : { ...nameOrOptions };

    return this.#contentAttachmentsModule.createAttachment(function_, options);
  };

  fileAttachment: AllureRuntime['fileAttachment'] = (filePath, nameOrOptions) => {
    typeAssertions.assertString(filePath, 'filePath');

    const options =
      typeof nameOrOptions === 'string'
        ? { name: nameOrOptions }
        : { name: path.basename(filePath), ...nameOrOptions };

    return this.#fileAttachmentsModule.attachment(filePath, options);
  };

  createFileAttachment: AllureRuntime['createFileAttachment'] = (function_, nameOrOptions) => {
    typeAssertions.assertFunction(function_);
    if (nameOrOptions != null) {
      this.#assertNameOrOptions<FileAttachmentOptions>(nameOrOptions);
    }

    const options =
      typeof nameOrOptions === 'string' ? { name: nameOrOptions } : { ...nameOrOptions };

    return this.#fileAttachmentsModule.createAttachment(function_, options);
  };

  // @ts-expect-error TS2322: too few arguments
  createStep: AllureRuntime['createStep'] = (nameFormat, maybeParameters, maybeFunction) => {
    typeAssertions.assertString(nameFormat, 'nameFormat');
    const function_: any = maybeFunction ?? maybeParameters;
    if (typeof function_ !== 'function') {
      throw new TypeError(`Expected a function, got instead: ${util.inspect(function_)}`);
    }

    const userParameters = Array.isArray(maybeParameters) ? maybeParameters : undefined;

    return this.#stepsDecorator.createStep(nameFormat, function_, userParameters);
  };

  step: AllureRuntime['step'] = (name, function_) => {
    typeAssertions.assertString(name, 'name');
    typeAssertions.assertFunction(function_);
    return this.#basicStepsModule.step(name, function_);
  };

  epic: AllureRuntime['epic'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('epic', value);
  };

  feature: AllureRuntime['feature'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('feature', value);
  };

  issue: AllureRuntime['issue'] = (name, url) => {
    typeAssertions.assertString(name, 'name');
    if (url != null) typeAssertions.assertString(url, 'url');

    this.#coreModule.link({ name, url: url ?? '', type: 'issue' });
  };

  owner: AllureRuntime['owner'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('owner', value);
  };

  package: AllureRuntime['package'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('package', value);
  };

  parentSuite: AllureRuntime['parentSuite'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('parentSuite', value);
  };

  severity: AllureRuntime['severity'] = (value) => {
    typeAssertions.assertSeverity(value);
    this.#coreModule.label('severity', value);
  };

  story: AllureRuntime['story'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('story', value);
  };

  subSuite: AllureRuntime['subSuite'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('subSuite', value);
  };

  suite: AllureRuntime['suite'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('suite', value);
  };

  tag: AllureRuntime['tag'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('tag', value);
  };

  tags: AllureRuntime['tags'] = (...values) => {
    for (const [index, value] of values.entries()) {
      typeAssertions.assertString(value, `values[${index}]`);
      this.#coreModule.label('tag', value);
    }
  };

  testClass: AllureRuntime['testClass'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('testClass', value);
  };

  testMethod: AllureRuntime['testMethod'] = (value) => {
    typeAssertions.assertString(value);
    this.#coreModule.label('testMethod', value);
  };

  thread: AllureRuntime['thread'] = (value) => {
    typeAssertions.assertPrimitive(value);
    this.#coreModule.label('thread', String(value));
  };

  tms: AllureRuntime['tms'] = (name, url) => {
    typeAssertions.assertString(name, 'name');

    if (url != null) typeAssertions.assertString(url, 'url');
    this.#coreModule.link({ name, url: url ?? '', type: 'tms' });
  };

  #assertNameOrOptions = <T extends {}>(nameOrOptions: string | T) => {
    if (nameOrOptions == null || (typeof nameOrOptions !== 'string' && !isObject(nameOrOptions))) {
      throw new TypeError(
        `Expected a name format string or attachment options, got instead: ${util.inspect(nameOrOptions)}`,
      );
    }
  };
}
