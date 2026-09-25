import type { Metadata } from 'jest-metadata';
export declare class AllureMetadataProxy<T = unknown> {
    protected readonly $metadata: Metadata;
    constructor(metadata: Metadata);
    get id(): string;
    get<V>(path?: keyof T, fallbackValue?: V): V;
    set<K extends keyof T>(path: K, value: T[K]): this;
    push<K extends keyof T>(key: K, values: Required<T>[K]): this;
    assign(values: Partial<T>): this;
    defaults(values: Partial<T>): this;
    protected $localPath(key?: keyof T, ...innerKeys: string[]): string[];
}
