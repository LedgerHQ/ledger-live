import type { AndroidEntry, IosEntry } from 'logkitten';
import type { VideokittenOptionsIOS, VideokittenOptionsAndroid } from 'videokitten';
export type OnErrorHandlerFn = (error: Error) => void;
export type OnErrorHandler = OnErrorHandlerFn | 'throw' | 'ignore' | 'warn';
export type DetoxAllure2AdapterOptions = {
    deviceLogs?: boolean | DetoxAllure2AdapterDeviceLogsOptions;
    deviceScreenshots?: boolean | DetoxAllure2AdapterDeviceScreenshotOptions;
    deviceVideos?: boolean | DetoxAllure2AdapterDeviceVideoOptions;
    deviceViewHierarchy?: boolean | DetoxAllure2AdapterDeviceViewHierarchyOptions;
    onError?: OnErrorHandler;
    userArtifacts?: 'ignore' | 'copy' | 'move';
};
export interface DetoxAllure2AdapterDeviceLogsOptions {
    ios?: (entry: IosEntry) => boolean;
    android?: (entry: AndroidEntry) => boolean;
    override?: boolean;
    saveAll?: boolean;
    syncDelay?: number | {
        ios?: number;
        android?: number;
    };
}
export interface DetoxAllure2AdapterDeviceScreenshotOptions {
    saveAll?: boolean;
}
export interface DetoxAllure2AdapterDeviceVideoOptions {
    saveAll?: boolean;
    lazyStart?: boolean;
    ios?: Partial<VideokittenOptionsIOS>;
    android?: Partial<VideokittenOptionsAndroid>;
}
export interface DetoxAllure2AdapterDeviceViewHierarchyOptions {
    stylesheet?: string | null | false;
}
