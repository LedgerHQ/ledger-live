import type { FetchBaseQueryError, NamedSchemaError } from "@reduxjs/toolkit/query";

/**
 * Turns a rejected response into a typed query error. It keeps the path and the message of each
 * issue, never the rejected value: an Earn response carries wallet and stake account addresses.
 */
export function describeSchemaFailure(error: NamedSchemaError): FetchBaseQueryError {
  const issues = error.issues
    .map(issue => {
      const path = issue.path?.map(String).join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");

  return {
    status: "CUSTOM_ERROR",
    error: `${error.schemaName} rejected the response: ${issues}`,
  };
}
