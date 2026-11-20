import type { z } from "zod";

export const describeIssuesWithoutValues = (issues: ReadonlyArray<z.core.$ZodIssue>): string =>
  issues.map(issue => `${issue.path.join(".") || "(root)"}: ${issue.code}`).join(", ");
