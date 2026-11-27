import type { FetchBaseQueryError, NamedSchemaError } from "@reduxjs/toolkit/query";

type Issue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }>;
};

export function describeIssues(issues: readonly Issue[]): string {
  return issues
    .map(issue => {
      const path = issue.path
        ?.map(segment => String(typeof segment === "object" ? segment.key : segment))
        .join(".");
      return path ? `${path}: ${issue.message}` : issue.message;
    })
    .join("; ");
}

/** Keeps which schema failed, so a caller can tell a refused argument from a 2xx it couldn't read. */
export function describeSchemaFailure(error: NamedSchemaError): FetchBaseQueryError {
  return {
    status: "CUSTOM_ERROR",
    error: describeIssues(error.issues),
    data: { schemaName: error.schemaName },
  };
}
