import type { Metadata } from 'jest-metadata';

import { PREFIX } from '../constants';

export class AllureMetadataProxy<T = unknown> {
  protected readonly $metadata: Metadata;

  constructor(metadata: Metadata) {
    this.$metadata = metadata;
  }

  get id(): string {
    return this.$metadata.id;
  }

  get<V>(path?: keyof T, fallbackValue?: V): V {
    const fullPath = this.$localPath(path);
    return this.$metadata.get(fullPath, fallbackValue);
  }

  set<K extends keyof T>(path: K, value: T[K]): this {
    const fullPath = this.$localPath(path);
    this.$metadata.set(fullPath, value);
    return this;
  }

  push<K extends keyof T>(key: K, values: Required<T>[K]): this {
    const path = this.$localPath(key);
    this.$metadata.push(path, values as unknown[]);
    return this;
  }

  assign(values: Partial<T>): this {
    this.$metadata.assign(this.$localPath(), values);
    return this;
  }

  defaults(values: Partial<T>): this {
    this.$metadata.defaults(this.$localPath(), values);
    return this;
  }

  protected $localPath(key?: keyof T, ...innerKeys: string[]): string[] {
    const allKeys = key ? [key as string, ...innerKeys] : innerKeys;
    return [PREFIX, ...allKeys];
  }
}
