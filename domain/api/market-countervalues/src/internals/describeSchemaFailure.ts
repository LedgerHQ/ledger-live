import type { FetchBaseQueryError, NamedSchemaError } from "@reduxjs/toolkit/query";

/** RTK Query cache tags owned by the countervalues use case. */
export const COUNTERVALUES_TAGS = ["CounterValueIdsSortedByMarketCap", "UsdToFiatRate"] as const;

/**
 * Turns a rejected response schema into a typed error instead of logging it.
 *
 * This package injects into a shared api and takes no logging dependency, so it has nowhere to log
 * from: `SchemaFailureInfo` carries only `endpoint`, `arg`, `type` and `queryCacheKey`, never the
 * thunk `extraArgument`. Surfacing the issues on the error is what `@shared/api-services`' Card
 * service does for the same reason, and it puts the detail where the caller can act on it.
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
    error: `${error.schemaName} rejected the response — ${issues}`,
  };
}
