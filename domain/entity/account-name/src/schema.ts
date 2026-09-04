import { z } from "zod";
import { type AnyAccountId } from "@shared/schema-primitives";

export const AccountNamesDistantSchema = z.record(z.string(), z.string());
export type AccountNamesDistantState = z.infer<typeof AccountNamesDistantSchema>;

// Local state keeps a Map, so it is not Zod-inferable: the distant schema is its JSON projection.
export type AccountNamesState = Map<AnyAccountId, string>;

export const initialAccountNamesState: AccountNamesState = new Map();
