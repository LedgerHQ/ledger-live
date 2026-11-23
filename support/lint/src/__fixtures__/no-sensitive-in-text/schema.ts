import { z } from "zod";

export const AccountKeySchema = z.string().min(1).brand<"AccountKey">().brand<"Sensitive">();
export const NetworkIdSchema = z.string().brand<"NetworkId">();
export const DescriptorSchema = z.object({ network: NetworkIdSchema, key: AccountKeySchema });

export type AccountKey = z.infer<typeof AccountKeySchema>;
export type NetworkId = z.infer<typeof NetworkIdSchema>;
export type AccountDescriptor = z.infer<typeof DescriptorSchema>;
