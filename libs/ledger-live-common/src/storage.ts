export interface SimpleStorage {
  kind: "simple";
  save(key: string, value: unknown): Promise<void>;
  get(key: string): Promise<unknown>;
}

export interface NamedSpaceStorage {
  kind: "namedspace";
  save(ns: string, key: string, value: unknown): Promise<void>;
  get(ns: string, key: string): Promise<unknown>;
}
