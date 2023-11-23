import { z } from "zod";

export const configSchema = z.object({
  /** this is key 1 */
  key1: z.number().min(0).default(1),
  /** this is key 2 */
  key2: z.string().min(1).default("2234ffdafs"),
  /** this is key 3 */
  key3: z.number().default(2.9),
  /** this is key 4 */
  key4: z.boolean().default(true),
});

export type Config = z.infer<typeof configSchema>;

export type ConfigKeys = keyof Config;
