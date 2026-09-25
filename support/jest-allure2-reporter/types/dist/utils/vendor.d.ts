import _ from 'lodash';
export declare const attempt: <TResult>(func: (...args: any[]) => TResult, ...args: any[]) => TResult | Error;
export declare const compactArray: <T>(array: _.List<T | _.Falsey> | null | undefined) => T[];
export declare const constant: <T>(value: T) => () => T;
export declare const defaults: {
    <TObject, TSource>(object: TObject, source: TSource): NonNullable<TSource & TObject>;
    <TObject, TSource1, TSource2>(object: TObject, source1: TSource1, source2: TSource2): NonNullable<TSource2 & TSource1 & TObject>;
    <TObject, TSource1, TSource2, TSource3>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3): NonNullable<TSource3 & TSource2 & TSource1 & TObject>;
    <TObject, TSource1, TSource2, TSource3, TSource4>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3, source4: TSource4): NonNullable<TSource4 & TSource3 & TSource2 & TSource1 & TObject>;
    <TObject>(object: TObject): NonNullable<TObject>;
    (object: any, ...sources: any[]): any;
};
export declare const get: {
    <TObject extends object, TKey extends keyof TObject>(object: TObject, path: TKey | [TKey]): TObject[TKey];
    <TObject extends object, TKey extends keyof TObject>(object: TObject | null | undefined, path: TKey | [TKey]): TObject[TKey] | undefined;
    <TObject extends object, TKey extends keyof TObject, TDefault>(object: TObject | null | undefined, path: TKey | [TKey], defaultValue: TDefault): Exclude<TObject[TKey], undefined> | TDefault;
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof TObject[TKey1]>(object: TObject, path: [TKey1, TKey2]): TObject[TKey1][TKey2];
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof NonNullable<TObject[TKey1]>>(object: TObject | null | undefined, path: [TKey1, TKey2]): NonNullable<TObject[TKey1]>[TKey2] | undefined;
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof NonNullable<TObject[TKey1]>, TDefault>(object: TObject | null | undefined, path: [TKey1, TKey2], defaultValue: TDefault): Exclude<NonNullable<TObject[TKey1]>[TKey2], undefined> | TDefault;
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof TObject[TKey1], TKey3 extends keyof TObject[TKey1][TKey2]>(object: TObject, path: [TKey1, TKey2, TKey3]): TObject[TKey1][TKey2][TKey3];
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof NonNullable<TObject[TKey1]>, TKey3 extends keyof NonNullable<NonNullable<TObject[TKey1]>[TKey2]>>(object: TObject | null | undefined, path: [TKey1, TKey2, TKey3]): NonNullable<NonNullable<TObject[TKey1]>[TKey2]>[TKey3] | undefined;
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof NonNullable<TObject[TKey1]>, TKey3 extends keyof NonNullable<NonNullable<TObject[TKey1]>[TKey2]>, TDefault>(object: TObject | null | undefined, path: [TKey1, TKey2, TKey3], defaultValue: TDefault): Exclude<NonNullable<NonNullable<TObject[TKey1]>[TKey2]>[TKey3], undefined> | TDefault;
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof TObject[TKey1], TKey3 extends keyof TObject[TKey1][TKey2], TKey4 extends keyof TObject[TKey1][TKey2][TKey3]>(object: TObject, path: [TKey1, TKey2, TKey3, TKey4]): TObject[TKey1][TKey2][TKey3][TKey4];
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof NonNullable<TObject[TKey1]>, TKey3 extends keyof NonNullable<NonNullable<TObject[TKey1]>[TKey2]>, TKey4 extends keyof NonNullable<NonNullable<NonNullable<TObject[TKey1]>[TKey2]>[TKey3]>>(object: TObject | null | undefined, path: [TKey1, TKey2, TKey3, TKey4]): NonNullable<NonNullable<NonNullable<TObject[TKey1]>[TKey2]>[TKey3]>[TKey4] | undefined;
    <TObject extends object, TKey1 extends keyof TObject, TKey2 extends keyof NonNullable<TObject[TKey1]>, TKey3 extends keyof NonNullable<NonNullable<TObject[TKey1]>[TKey2]>, TKey4 extends keyof NonNullable<NonNullable<NonNullable<TObject[TKey1]>[TKey2]>[TKey3]>, TDefault>(object: TObject | null | undefined, path: [TKey1, TKey2, TKey3, TKey4], defaultValue: TDefault): Exclude<NonNullable<NonNullable<NonNullable<TObject[TKey1]>[TKey2]>[TKey3]>[TKey4], undefined> | TDefault;
    <T>(object: _.NumericDictionary<T>, path: number): T;
    <T>(object: _.NumericDictionary<T> | null | undefined, path: number): T | undefined;
    <T, TDefault>(object: _.NumericDictionary<T> | null | undefined, path: number, defaultValue: TDefault): T | TDefault;
    <TDefault>(object: null | undefined, path: _.PropertyPath, defaultValue: TDefault): TDefault;
    (object: null | undefined, path: _.PropertyPath): undefined;
    <TObject, TPath extends string>(data: TObject, path: TPath): string extends TPath ? any : _.GetFieldType<TObject, TPath>;
    <TObject, TPath extends string, TDefault = _.GetFieldType<TObject, TPath, "Path">>(data: TObject, path: TPath, defaultValue: TDefault): Exclude<_.GetFieldType<TObject, TPath>, null | undefined> | TDefault;
    (object: any, path: _.PropertyPath, defaultValue?: any): any;
};
export declare const groupBy: {
    <T>(collection: _.List<T> | null | undefined, iteratee?: _.ValueIteratee<T>): _.Dictionary<T[]>;
    <T extends object>(collection: T | null | undefined, iteratee?: _.ValueIteratee<T[keyof T]>): _.Dictionary<Array<T[keyof T]>>;
};
export declare const isEmpty: {
    <T extends {
        __trapAny: any;
    }>(value?: T): boolean;
    (value: string): value is "";
    (value: Map<any, any> | Set<any> | _.List<any> | null | undefined): boolean;
    (value: object): boolean;
    <T extends object>(value: T | null | undefined): value is _.EmptyObjectOf<T> | null | undefined;
    (value?: any): boolean;
};
export declare const isError: (value: any) => value is Error;
export declare const isObject: (value?: any) => value is object;
export declare const last: <T>(array: _.List<T> | null | undefined) => T | undefined;
export declare const mapValues: {
    <TResult>(obj: string | null | undefined, callback: _.StringIterator<TResult>): _.NumericDictionary<TResult>;
    <T, TResult>(array: T[], callback: _.ArrayIterator<T, TResult>): _.NumericDictionary<TResult>;
    <T extends object, TResult>(obj: T | null | undefined, callback: _.ObjectIterator<T, TResult>): { [P in keyof T]: TResult; };
    <T>(obj: _.Dictionary<T> | _.NumericDictionary<T> | null | undefined, iteratee: object): _.Dictionary<boolean>;
    <T extends object>(obj: T | null | undefined, iteratee: object): { [P in keyof T]: boolean; };
    <T, TKey extends keyof T>(obj: _.Dictionary<T> | _.NumericDictionary<T> | null | undefined, iteratee: TKey): _.Dictionary<T[TKey]>;
    <T>(obj: _.Dictionary<T> | _.NumericDictionary<T> | null | undefined, iteratee: string): _.Dictionary<any>;
    <T extends object>(obj: T | null | undefined, iteratee: string): { [P in keyof T]: any; };
    (obj: string | null | undefined): _.NumericDictionary<string>;
    <T>(obj: _.Dictionary<T> | _.NumericDictionary<T> | null | undefined): _.Dictionary<T>;
    <T extends object>(obj: T): T;
    <T extends object>(obj: T | null | undefined): _.PartialObject<T>;
};
export declare const merge: {
    <TObject, TSource>(object: TObject, source: TSource): TObject & TSource;
    <TObject, TSource1, TSource2>(object: TObject, source1: TSource1, source2: TSource2): TObject & TSource1 & TSource2;
    <TObject, TSource1, TSource2, TSource3>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3): TObject & TSource1 & TSource2 & TSource3;
    <TObject, TSource1, TSource2, TSource3, TSource4>(object: TObject, source1: TSource1, source2: TSource2, source3: TSource3, source4: TSource4): TObject & TSource1 & TSource2 & TSource3 & TSource4;
    (object: any, ...otherArgs: any[]): any;
};
export declare const memoize: {
    <T extends (...args: any) => any>(func: T, resolver?: (...args: Parameters<T>) => any): T & _.MemoizedFunction;
    Cache: _.MapCacheConstructor;
};
export declare const once: <T extends (...args: any) => any>(func: T) => T;
export declare const snakeCase: (string?: string) => string;
export declare const uniq: <T>(array: _.List<T> | null | undefined) => T[];
