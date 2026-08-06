import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { DADA_REDUCER_PATH } from "./constants";

/**
 * Endpoint-less DADA api. Register it in the store; use cases add endpoints and tags to this same
 * object — see {@link https://github.com/LedgerHQ/ledger-live/blob/develop/shared/api-services/README.md}.
 *
 * Unlike the other services this one has no `extraArgument` contract yet, so it declares no
 * `schema.ts`/`types.ts`. DADA endpoints currently build absolute URLs themselves and pick prod or
 * staging per request from an `isStaging` query arg, so there is nothing for the base query to own.
 *
 * TODO: migrate the URL to `extraArgument` so the app resolves prod/staging once at store config,
 * matching every other service here. That drops `isStaging` from the query args and touches both
 * apps' store setup, so it is deliberately not part of the relocation (LIVE-35226).
 */
export const dadaApi = createApi({
  reducerPath: DADA_REDUCER_PATH,
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  tagTypes: [],
  endpoints: () => ({}),
});

export type DadaApi = typeof dadaApi;
