import type { AllureRuntimePluginContext, ContentAttachmentHandler } from '@support/jest-allure2-reporter/api';
export interface GlobalViewHierarchyHandlerOptions {
    platform?: 'ios' | 'android';
    stylesheet?: string | null | boolean;
}
export interface UserViewHierarchyHandlerOptions {
    screenshot?: string;
    activePointer?: string;
    errorMessage?: string;
}
export type ViewHierarchyHandlerFactory$1 = (globalOptions: GlobalViewHierarchyHandlerOptions) => ViewHierarchyHandlerFactory;
export type ViewHierarchyHandlerFactory = (userOptions?: UserViewHierarchyHandlerOptions) => ContentAttachmentHandler;
export declare function createViewHierarchyHandlerFactory(pluginContext: AllureRuntimePluginContext): ViewHierarchyHandlerFactory$1;
