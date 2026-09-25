import { OnErrorHandlerFn } from '../types';
export declare class RecycleBin {
    private readonly _onError;
    private static _instance;
    private readonly _files;
    private constructor();
    static instance(onError?: OnErrorHandlerFn): RecycleBin;
    add: (filePath: string) => Promise<void>;
    delete: (filePath: string) => Promise<void>;
    clear: () => Promise<void>;
}
