export declare function compactObject<V>(object: Record<string, V | undefined | null>, excludeNulls: true): Record<string, V>;
export declare function compactObject<V>(object: Record<string, V | undefined>, excludeNulls?: false): Record<string, V>;
