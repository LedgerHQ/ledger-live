import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expiry must be YYYY-MM-DD");

export const quarantineFilterSchema = z
  .object({
    files: z.string().min(1).optional(),
    title: z.string().min(1).optional(),
  })
  .refine(f => f.files !== undefined || f.title !== undefined, {
    message: "filter must include at least one of `files` or `title`",
  });

export const quarantineEntryFileSchema = z.object({
  team: z.string().min(1),
  expiry: isoDate,
  reason: z.string().min(1),
  failureMode: z.enum(["skip", "optional"]),
  filter: quarantineFilterSchema,
});

export type QuarantineEntryFile = z.infer<typeof quarantineEntryFileSchema>;

export type QuarantineEntry = QuarantineEntryFile & {
  /** Basename of the YAML file without extension */
  id: string;
};
