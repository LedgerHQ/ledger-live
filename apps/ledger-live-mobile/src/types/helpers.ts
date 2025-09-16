export type Maybe<T> = T | null | undefined;

export type UnionToIntersection<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Merge<A, B> = Omit<A, keyof B> & B;

export type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null;
};

export type EntryOf<
  T extends Record<string, unknown>,
  K extends keyof T = keyof T,
> = K extends unknown ? [K, T[K]] : never;

export type Primitive = number | string | boolean | bigint | symbol | null | undefined;
