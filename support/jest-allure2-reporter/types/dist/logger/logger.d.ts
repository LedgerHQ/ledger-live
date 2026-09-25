import { type BunyaminLogRecordFields } from 'bunyamin';
export declare const log: import("bunyamin").Bunyamin<import("bunyamin").BunyanLikeLogger>;
export declare const optimizeForTracing: (<T extends (...arguments_: any[]) => BunyaminLogRecordFields>(function_: T) => T) | (() => () => BunyaminLogRecordFields);
