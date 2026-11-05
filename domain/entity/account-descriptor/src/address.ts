import { z } from "zod";

/** An address on a network: branded so analytics can refuse it. */
export const AddressSchema = z.string().min(1).brand<"Address">();

export type Address = z.infer<typeof AddressSchema>;
