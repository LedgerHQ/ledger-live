import { cardApi } from "@shared/api-services";
import { CARD_MANAGEMENT_TAGS } from "./constants";

export const cardManagementApi = cardApi
  .enhanceEndpoints({ addTagTypes: CARD_MANAGEMENT_TAGS })
  .injectEndpoints({
    endpoints: () => ({}),
  });

export type CardManagementApi = typeof cardManagementApi;
