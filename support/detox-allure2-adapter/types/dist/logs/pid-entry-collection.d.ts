import type { Entry } from 'logkitten';
export declare class PIDEntryCollection {
    private _entries;
    private _purgatory;
    private _pid;
    private _current;
    get pid(): number;
    set pid(value: number);
    static format(entry: Entry): string;
    push(entry: Entry): void;
    flushAsString(): string;
    private _flush;
}
