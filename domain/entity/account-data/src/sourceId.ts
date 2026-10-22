import { z } from "zod";

/** The source that answered a read: only it can serve the next page of what it answered. */
export const AccountDataSourceIdSchema = z.string().min(1).brand<"AccountDataSourceId">();

export type AccountDataSourceId = z.infer<typeof AccountDataSourceIdSchema>;
