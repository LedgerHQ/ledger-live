import { z } from "zod";

export const TrustchainMemberKeySchema = z.strictObject({
  id: z.string().min(1),
  publicKey: z.hex().length(66).lowercase(),
});

export type TrustchainMemberKey = z.infer<typeof TrustchainMemberKeySchema>;

export const TrustchainSchema = z.strictObject({
  rootId: z.string().min(1),
  applicationPath: z.string().min(1),
});

export type Trustchain = z.infer<typeof TrustchainSchema>;

export const TrustchainStateSchema = z.strictObject({
  trustchain: TrustchainSchema.nullable(),
  memberKey: TrustchainMemberKeySchema.nullable(),
});

export type TrustchainState = z.infer<typeof TrustchainStateSchema>;

export const initialTrustchainState: TrustchainState = {
  trustchain: null,
  memberKey: null,
};
