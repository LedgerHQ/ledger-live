import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

type SchemaIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
};

/**
 * Turns a schema failure into an error that names the schema and lists its issues.
 *
 * The value that failed validation is dropped on purpose. For the two OAuth2 grants that value is
 * the whole token response, and RTK would otherwise carry it into the rejected action. An issue
 * message names a constraint, never the string that broke it, for every schema this service parses.
 */
export function toSchemaFailureError(
  schemaName: string,
  issues: readonly SchemaIssue[],
): FetchBaseQueryError {
  return {
    status: "CUSTOM_ERROR",
    error: `${schemaName} validation failed`,
    data: issues.map(issue => ({ path: formatPath(issue.path), message: issue.message })),
  };
}

function formatPath(path: SchemaIssue["path"]): string {
  if (!path) {
    return "";
  }

  return path.map(segment => String(typeof segment === "object" ? segment.key : segment)).join(".");
}
