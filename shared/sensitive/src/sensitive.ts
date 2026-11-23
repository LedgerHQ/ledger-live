import type { z } from "zod";

/** A zod brand on a value that must never reach analytics, logs or error messages. */
type SensitiveBrand = z.$brand<"Sensitive">;

/** How deep props are searched; a bound keeps generic signatures (`Parameters<typeof track>`) cheap. */
type MaxDepth = 6;

type HasSensitive<T, Depth extends unknown[] = []> = Depth["length"] extends MaxDepth
  ? false
  : 0 extends 1 & T
    ? false
    : T extends SensitiveBrand
      ? true
      : T extends readonly unknown[]
        ? HasSensitive<T[number], [...Depth, unknown]>
        : T extends object
          ? true extends {
              [K in keyof T]-?: HasSensitive<T[K], [...Depth, unknown]>;
            }[keyof T]
            ? true
            : false
          : false;

/** `unknown` when `T` holds no `Sensitive` brand, down to 6 levels, in any union member; else a type no value matches. */
export type NoSensitive<T> =
  true extends HasSensitive<T>
    ? { "Sensitive value: pass its AccountUUID instead": never }
    : unknown;
