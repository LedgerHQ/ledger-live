/**
 * Local GraphQL client for the SUI transport. Replaces `SuiGraphQLClient` from
 * `@mysten/sui/graphql`, which dragged in `generated/queries.mjs` (~620 KB raw) and
 * the full `graphql` package's `print` for ~140 KB of bundle weight we don't need —
 * we only call `.query()` against hand-written gql.tada documents.
 */
import { print } from "@0no-co/graphql.web";
import type { TadaDocumentNode } from "gql.tada";

class SuiGraphQLRequestError extends Error {}

interface QueryResponse<TData> {
  data?: TData | null;
  errors?: ReadonlyArray<{ message: string }> | null;
}

export function createSuiGraphQLClient(opts: {
  url: string;
  fetch?: typeof fetch;
  headers?: Record<string, string>;
}) {
  const doFetch = opts.fetch ?? fetch;
  const requestHeaders = {
    "content-type": "application/json",
    accept: "application/json",
    ...opts.headers,
  };
  return {
    async query<TData, TVars>(args: {
      query: TadaDocumentNode<TData, TVars>;
      variables?: TVars;
    }): Promise<QueryResponse<TData>> {
      const res = await doFetch(opts.url, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({ query: print(args.query), variables: args.variables }),
      });
      if (!res.ok) {
        throw new SuiGraphQLRequestError(`Sui GraphQL HTTP ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as QueryResponse<TData>;
    },
  };
}

export type SuiGraphQLClient = ReturnType<typeof createSuiGraphQLClient>;
