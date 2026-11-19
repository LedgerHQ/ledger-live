import type { EarnPositions } from "@domain/entity-earn-position";
import { earnApi } from "@shared/api-services";
import { describeSchemaFailure } from "./internals/describeSchemaFailure";
import { StakesV3WireSchema, toEarnPositions, type StakesV3Wire } from "./internals/stakes";
import {
  ValidatorsSummaryWireSchema,
  toSolanaValidatorApyByVoteAccount,
  type ValidatorsSummaryWire,
} from "./internals/validatorsSummary";
import type { GetEarnPositionsArgs, SolanaValidatorApyByVoteAccount } from "./types";

/** Cache tag of the positions of an address, with that address as its id. */
export const EARN_POSITIONS_TAG = "EarnPositions";

const FIVE_MINUTES = 5 * 60;
const ONE_HOUR = 60 * 60;

/** A fresh read gets more time than the 10 s default of the Earn service. */
const FRESH_READ_TIMEOUT_MS = 20_000;

/**
 * Earn positions endpoints, injected into the shared Earn service api.
 *
 * `enhanceEndpoints` and `injectEndpoints` both mutate and return that same api object, so this
 * reference shares its reducer, middleware and cache with every other Earn use case, while only this
 * one is typed with the endpoints below.
 */
export const earnPositionsApi = earnApi
  .enhanceEndpoints({ addTagTypes: [EARN_POSITIONS_TAG] })
  .injectEndpoints({
    endpoints: build => ({
      getEarnPositions: build.query<EarnPositions, GetEarnPositionsArgs>({
        query: ({ network, address, fresh }) => ({
          url: "/v3/stakes",
          method: "POST",
          body: [{ network, address, ...(fresh ? { fresh: true } : {}) }],
          ...(fresh ? { timeoutMs: FRESH_READ_TIMEOUT_MS } : {}),
        }),
        // A read with `fresh: false` shares the cache entry of a read without the flag.
        serializeQueryArgs: ({ queryArgs: { network, address, fresh } }) => ({
          network,
          address,
          fresh: fresh === true,
        }),
        rawResponseSchema: StakesV3WireSchema,
        transformResponse: (wire: StakesV3Wire, _meta, args) => toEarnPositions(wire, args),
        catchSchemaFailure: describeSchemaFailure,
        providesTags: (_result, _error, { address }) => [{ type: EARN_POSITIONS_TAG, id: address }],
        keepUnusedDataFor: FIVE_MINUTES,
      }),

      getSolanaValidatorApy: build.query<SolanaValidatorApyByVoteAccount, void>({
        query: () => "/figment/solana/validators_summary",
        rawResponseSchema: ValidatorsSummaryWireSchema,
        transformResponse: (wire: ValidatorsSummaryWire) => toSolanaValidatorApyByVoteAccount(wire),
        catchSchemaFailure: describeSchemaFailure,
        keepUnusedDataFor: ONE_HOUR,
      }),
    }),
  });

export const { useGetEarnPositionsQuery, useGetSolanaValidatorApyQuery } = earnPositionsApi;
