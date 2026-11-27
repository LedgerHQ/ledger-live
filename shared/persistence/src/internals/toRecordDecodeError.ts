import type { z } from "zod";
import { RecordDecodeError } from "../errors";

const describeIssuesWithoutValues = (issues: ReadonlyArray<z.core.$ZodIssue>): string =>
  Array.from(new Set(issues.map(issue => issue.code))).join(", ");

export const toRecordDecodeError = (
  key: string,
  version: number,
  issues: ReadonlyArray<z.core.$ZodIssue>,
): RecordDecodeError => new RecordDecodeError(key, version, describeIssuesWithoutValues(issues));

const nameOf = (thrown: unknown): string => (thrown instanceof Error ? thrown.name : typeof thrown);

export const toThrownRecordDecodeError = (
  key: string,
  version: number,
  source: string,
  thrown: unknown,
): RecordDecodeError => new RecordDecodeError(key, version, `${source} threw ${nameOf(thrown)}`);
