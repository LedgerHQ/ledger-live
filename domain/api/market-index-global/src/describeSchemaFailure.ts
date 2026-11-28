import type { FetchBaseQueryError, NamedSchemaError } from "@reduxjs/toolkit/query";

/** Turns a rejected response schema into a typed error; this package has no logging dependency. */
export function describeSchemaFailure(error: NamedSchemaError): FetchBaseQueryError {
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
