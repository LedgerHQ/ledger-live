export type Maybe<T> = T | null | undefined;

export type UnionToIntersection<T> =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (T extends any ? (x: T) => any : never) extends (x: infer R) => any ? R : never;

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type GetReducerPayload<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P extends { [key: string]: (arg1: any, arg2: { payload: any }) => any },
> = UnionToIntersection<Parameters<P[keyof P]>[1]["payload"]>;

export type Unpacked<T> = T extends (infer U)[] ? U : T;

export type Merge<A, B> = Omit<A, keyof B> & B;

export type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null;
};
