import { FileNavigator } from './index';
export declare class FileNavigatorCache {
    #private;
    resolve: (filePath: string) => Promise<FileNavigator | undefined>;
    hasScannedSourcemap: (filePath: string) => boolean;
    scanSourcemap: (filePath: string) => Promise<void>;
    clear(): void;
    static readonly instance: FileNavigatorCache;
}
