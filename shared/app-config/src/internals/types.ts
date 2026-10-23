import type { z } from "zod";
import type { ConfigSchemaSwitches } from "../types";

type UnionToIntersection<Union> = (Union extends unknown ? (union: Union) => void : never) extends (
  intersection: infer Intersection,
) => void
  ? Intersection
  : never;

/** The shape of every configuration value: the shapes of all the switches, and the fixed shape. */
export type ValuesShape<
  Switches extends ConfigSchemaSwitches,
  Fixed extends z.ZodRawShape,
> = UnionToIntersection<Switches[keyof Switches]> & Fixed extends infer Shape extends z.ZodRawShape
  ? { [Name in keyof Shape]: Shape[Name] }
  : never;
