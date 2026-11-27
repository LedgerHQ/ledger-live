import type { FetchBaseQueryError, NamedSchemaError } from "@reduxjs/toolkit/query";

/** RTK Query cache tags owned by the trending categories use case. */
export const TRENDING_CATEGORIES_TAGS = ["TrendingCategories"] as const;

export const MAX_TRENDING_CATEGORIES = 5;

/** Three minutes, in seconds. */
export const TRENDING_CATEGORIES_KEEP_UNUSED_DATA_FOR = 3 * 60;

/**
 * Turns a rejected response schema into a typed error instead of logging it.
 *
 * This package injects into a shared api and takes no logging dependency, so the issues travel on
 * the error, where the caller can act on them.
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
