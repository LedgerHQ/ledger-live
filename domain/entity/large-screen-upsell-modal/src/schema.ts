import { z } from "zod";

export const LargeScreenUpsellModalStateSchema = z.object({
  retries: z.number().int().nonnegative().safe(),
  lastSeenAt: z.number().int().nonnegative().safe().nullable(),
});

export const defaultLargeScreenUpsellModalState: z.infer<typeof LargeScreenUpsellModalStateSchema> =
  {
    retries: 0,
    lastSeenAt: null,
  };

export const RestorableLargeScreenUpsellModalStateSchema = z
  .object({
    retries: LargeScreenUpsellModalStateSchema.shape.retries.catch(
      defaultLargeScreenUpsellModalState.retries,
    ),
    lastSeenAt: LargeScreenUpsellModalStateSchema.shape.lastSeenAt.catch(
      defaultLargeScreenUpsellModalState.lastSeenAt,
    ),
  })
  .catch(defaultLargeScreenUpsellModalState);
