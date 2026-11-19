import type { z } from "zod";
import { RecordDecodeError } from "./errors";
import { describeIssuesWithoutValues } from "./internals/describeIssuesWithoutValues";

/** The decode error of a schema failure, with no value. */
export const toRecordDecodeError = (
  key: string,
  version: number,
  issues: ReadonlyArray<z.core.$ZodIssue>,
): RecordDecodeError => new RecordDecodeError(key, version, describeIssuesWithoutValues(issues));
