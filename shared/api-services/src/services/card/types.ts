import type { z } from "zod";
import type { CardApiExtraSchema } from "./schema";

/** Slice of the Redux thunk `extraArgument` owned by the Card backend service. */
export type CardApiExtra = z.infer<typeof CardApiExtraSchema>;

export type CardSessionSnapshot = Readonly<{
  token: string | null;
  sessionId: number;
}>;

export type CardSessionRefreshResult =
  | { readonly kind: "refreshed"; readonly accessToken: string }
  | { readonly kind: "session-ended" }
  | { readonly kind: "session-replaced" };

export type CardBaseQueryExtraOptions = Readonly<{
  authenticated?: boolean;
}>;
