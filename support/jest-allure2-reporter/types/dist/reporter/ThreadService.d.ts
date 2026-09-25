export declare class ThreadService {
    private readonly _activeThreads;
    allocateThread(testPath: string): number;
    freeThread(testPath: string): void;
}
