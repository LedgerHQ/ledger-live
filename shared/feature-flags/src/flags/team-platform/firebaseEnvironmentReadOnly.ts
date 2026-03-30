import { z } from "zod";
import { flagWith } from "../../define";

export const firebaseEnvironmentReadOnly = flagWith(
  {
    comment: z.string(),
    project: z.string(),
  },
  {
    enabled: false,
    params: {
      comment:
        "Do not modify this configuration. This is just a read-only helper to display the targeted Firebase environment in Ledger Live. The value of this flag has NO functional impact.",
      project: "n/a (Firebase project could not be reached)",
    },
  },
);
