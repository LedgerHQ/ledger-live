import { z } from "zod";

// Max JS Date timestamp (ECMA-262): +/-8.64e15 ms. Values above this yield an Invalid Date.
export const MAX_DATE_MS = 8_640_000_000_000_000;

export const LargeScreenUpsellModalSessionSchema = z.enum([
  "ready",
  "dismissed",
  "blockedByCompeting",
]);

export type LargeScreenUpsellModalSession = z.infer<typeof LargeScreenUpsellModalSessionSchema>;

export const LargeScreenUpsellModalStateSchema = z.object({
  retries: z.number().int().nonnegative().safe(),
  lastSeenAt: z.number().int().nonnegative().max(MAX_DATE_MS).safe().nullable(),
  session: LargeScreenUpsellModalSessionSchema,
});

export const defaultLargeScreenUpsellModalState: z.infer<typeof LargeScreenUpsellModalStateSchema> =
  {
    retries: 0,
    lastSeenAt: null,
    session: "ready",
  };

/** Persisted fields only — session is ephemeral. */
export const RestorableLargeScreenUpsellModalStateSchema = z
  .object({
    retries: LargeScreenUpsellModalStateSchema.shape.retries.catch(
      defaultLargeScreenUpsellModalState.retries,
    ),
    lastSeenAt: LargeScreenUpsellModalStateSchema.shape.lastSeenAt.catch(
      defaultLargeScreenUpsellModalState.lastSeenAt,
    ),
  })
  .catch({
    retries: defaultLargeScreenUpsellModalState.retries,
    lastSeenAt: defaultLargeScreenUpsellModalState.lastSeenAt,
  });

export type RestorableLargeScreenUpsellModalState = Pick<
  z.infer<typeof LargeScreenUpsellModalStateSchema>,
  "retries" | "lastSeenAt"
>;
