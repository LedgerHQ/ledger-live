import type { z } from "zod";
import { RecordDecodeError } from "../errors";

const describeIssuesWithoutValues = (issues: ReadonlyArray<z.core.$ZodIssue>): string =>
  issues.map(issue => `${issue.path.join(".") || "(root)"}: ${issue.code}`).join(", ");

export const toRecordDecodeError = (
  key: string,
  version: number,
  issues: ReadonlyArray<z.core.$ZodIssue>,
): RecordDecodeError => new RecordDecodeError(key, version, describeIssuesWithoutValues(issues));
