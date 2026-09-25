export declare function flatMapAsync<T, U>(array: T[], callback: (value: T, index: number, array: T[]) => Promise<U[]>): Promise<U[]>;
