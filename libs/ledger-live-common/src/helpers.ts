/* eslint-disable @typescript-eslint/no-explicit-any */
import * as z from "zod";

// Small helper to avoid issues with includes and typescript
// more infos: https://fettblog.eu/typescript-array-includes/
export function includes<T extends U, U>(array: ReadonlyArray<T>, element: U): element is T {
  return array.includes(element as T);
}

type isAny<T> = [any extends T ? "true" : "false"] extends ["true"] ? true : false;
type nonoptional<T> = T extends undefined ? never : T;
type nonnullable<T> = T extends null ? never : T;
type equals<X, Y> = [X] extends [Y] ? ([Y] extends [X] ? true : false) : false;

export type toZod<T> = {
  any: never;
  optional: z.ZodOptional<toZod<nonoptional<T>>>;
  nullable: z.ZodUnion<[toZod<nonnullable<T>>, z.ZodNull]>;
  array: T extends Array<infer U> ? z.ZodArray<toZod<U>> : never;
  string: z.ZodString;
  bigint: z.ZodBigInt;
  number: z.ZodNumber;
  boolean: z.ZodBoolean;
  date: z.ZodDate;
  object: z.ZodObject<{ [k in keyof T]: toZod<T[k]> }, "strict", z.ZodTypeAny, T>;
  rest: never;
}[zodKey<T>];

type zodKey<T> = isAny<T> extends true
  ? "any"
  : equals<T, boolean> extends true //[T] extends [booleanUtil.Type]
  ? "boolean"
  : [undefined] extends [T]
  ? "optional"
  : [null] extends [T]
  ? "nullable"
  : T extends any[]
  ? "array"
  : equals<T, string> extends true
  ? "string"
  : equals<T, bigint> extends true //[T] extends [bigintUtil.Type]
  ? "bigint"
  : equals<T, number> extends true //[T] extends [numberUtil.Type]
  ? "number"
  : equals<T, Date> extends true //[T] extends [dateUtil.Type]
  ? "date"
  : T extends { [k: string]: any } //[T] extends [structUtil.Type]
  ? "object"
  : "rest";
