import { z } from "zod";

export const schemaAccountMetadata = z.object({
  id: z.string(),
  currencyId: z.string(),
  freshAddress: z.string(),
  seedIdentifier: z.string(),
  derivationMode: z.string(),
  name: z.string(),
  index: z.number(),
});
