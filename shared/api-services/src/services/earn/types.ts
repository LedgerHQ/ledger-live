import type { FetchArgs } from "@reduxjs/toolkit/query/react";
import type { z } from "zod";
import type { EarnApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Earn service. */
export type EarnApiExtra = z.infer<typeof EarnApiExtraSchema>;

/** A request to the Earn backend. `timeoutMs` bounds each attempt, 10 s when it is absent. */
export type EarnFetchArgs = FetchArgs & { timeoutMs?: number };
