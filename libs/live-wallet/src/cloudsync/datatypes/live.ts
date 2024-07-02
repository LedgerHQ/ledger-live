import { z } from "zod";

export const accountDescriptorSchema = z.object({
  id: z.string(),
  currencyId: z.string(),
  freshAddress: z.string(),
  seedIdentifier: z.string(),
  derivationMode: z.string(),
  index: z.number(),
});
export type AccountDescriptor = z.infer<typeof accountDescriptorSchema>;

export const accountsDescriptorSchema = z.array(accountDescriptorSchema);

export const liveSchema = z.object({
  accounts: accountsDescriptorSchema,
  accountNames: z.record(z.string()),
  // NB: append more fields here when we have more needs in the future, but NEVER break a type
});

export type LiveData = z.infer<typeof liveSchema>;

export const liveSlug = "live";
