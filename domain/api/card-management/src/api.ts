import { cardApi } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS } from "./constants";

/**
 * Card Management endpoints, injected into the shared Card service api.
 *
 * `enhanceEndpoints` registers this use case's own cache tags on that api and `injectEndpoints` adds
 * the endpoints — both mutate and return the same `cardApi` object, so this reference shares its
 * reducer, middleware and cache with every other Card use case (Auth, once it migrates off the
 * `@domain/api-pay-card` holdout under LIVE-33829).
 *
 * Scaffold: no endpoints yet. They land with the first Card Management contract; a view-model importing
 * a generated hook triggers this module (and therefore the injection) as a value import.
 */
export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: () => ({}),
  });

export type CardManagementApi = typeof cardManagementApi;
