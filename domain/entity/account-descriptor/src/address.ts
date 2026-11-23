import { z } from "zod";

/** An address on a network: sensitive, so analytics and logs refuse it. */
export const AddressSchema = z.string().min(1).brand<"Address">().brand<"Sensitive">();

export type Address = z.infer<typeof AddressSchema>;
