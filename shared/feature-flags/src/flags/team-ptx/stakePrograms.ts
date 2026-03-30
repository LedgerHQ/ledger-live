import { z } from "zod";
import { flagWith } from "../../define";

const platformManifestIdSchema = z.enum(["stakekit", "kiln-widget", "earn"]);

const redirectSchema = z.object({
  platform: platformManifestIdSchema,
  name: z.string(),
  queryParams: z.record(z.string(), z.string()).optional(),
});

const versionedRedirectSchema = z.object({
  desktop_version: z.string().optional(),
  mobile_version: z.string().optional(),
  redirects: z.record(z.string(), redirectSchema),
});

export const stakePrograms = flagWith(
  {
    list: z.array(z.string()),
    redirects: z.record(z.string(), redirectSchema),
    versions: z.array(versionedRedirectSchema).optional(),
  },
  {
    enabled: false,
    params: { list: [], redirects: {} },
  },
);
