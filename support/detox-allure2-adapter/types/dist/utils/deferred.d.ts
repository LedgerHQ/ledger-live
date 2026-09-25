export declare class Deferred<T> {
    promise: Promise<void>;
    private _resolve;
    private _settled;
    private _timeout;
    private _cleanup;
    private _predicate;
    constructor({ timeoutMs, predicate, cleanup, }: {
        timeoutMs: number;
        predicate: (value: T) => boolean;
        cleanup: () => void;
    });
    update(value: T): void;
}
