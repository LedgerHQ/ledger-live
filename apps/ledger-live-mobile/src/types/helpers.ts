export type Maybe<T> = T | undefined;

export type UnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? R
  : never;

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };

export type GetReducerPayload<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  P extends { [key: string]: (arg1: any, arg2: { payload: any }) => any },
> = UnionToIntersection<Parameters<P[keyof P]>[1]["payload"]>;
