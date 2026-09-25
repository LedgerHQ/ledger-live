import type {
  AllureRuntimePluginContext,
  ContentAttachmentHandler,
  // eslint-disable-next-line import/no-internal-modules
} from '@support/jest-allure2-reporter/api';

import { XmlBuilder } from './xml-processor';

export interface GlobalViewHierarchyHandlerOptions {
  platform?: 'ios' | 'android';
  stylesheet?: string | null | boolean;
}

export interface UserViewHierarchyHandlerOptions {
  screenshot?: string;
  activePointer?: string;
  errorMessage?: string;
}

export type ViewHierarchyHandlerFactory$1 = (
  globalOptions: GlobalViewHierarchyHandlerOptions,
) => ViewHierarchyHandlerFactory;
export type ViewHierarchyHandlerFactory = (
  userOptions?: UserViewHierarchyHandlerOptions,
) => ContentAttachmentHandler;

export function createViewHierarchyHandlerFactory(
  pluginContext: AllureRuntimePluginContext,
): ViewHierarchyHandlerFactory$1 {
  return (globalOptions) => (userOptions) =>
    async function viewHierarchyHandler(context) {
      const options = { ...globalOptions, ...userOptions };
      const content = new XmlBuilder(context.content.toString())
        .withStylesheet(options.stylesheet)
        .withPlatform(options.platform)
        .withScreenshot(options.screenshot)
        .withActivePointer(options.activePointer)
        .withErrorMessage(options.errorMessage)
        .toString();

      return pluginContext.contentAttachmentHandlers.write({ ...context, content });
    };
}
