import type { FetchBaseQueryError, NamedSchemaError } from "@reduxjs/toolkit/query";

/**
 * Turns a rejected response schema into a typed error instead of logging it.
 *
 * This package injects into a shared api and takes no logging dependency, so it has nowhere to log
 * from: the error carries the rejected paths and messages, where the caller can act on them.
 */
export function describeSchemaFailure(
  error: Pick<NamedSchemaError, "issues" | "schemaName">,
): FetchBaseQueryError {
  const issues = error.issues
    .map(issue => {
      const path = issue.path?.map(String).join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");

  return {
    status: "CUSTOM_ERROR",
    error: `${error.schemaName} rejected the response — ${issues}`,
  };
}
