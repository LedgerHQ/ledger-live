import { exchangeFundApi } from "@shared/api-services";
import { FUND_CARD_REMIT_PATH, fundOutcomePath } from "./constants";
import { FundRemitResponseSchema } from "./schema";
import type {
  FundCancelRequest,
  FundOutcomeRequest,
  FundRemitRequest,
  FundRemitResponse,
} from "./types";

export const exchangeFundManagementApi = exchangeFundApi.injectEndpoints({
  endpoints: build => ({
    remitFundCard: build.mutation<FundRemitResponse, FundRemitRequest>({
      query: body => ({
        url: FUND_CARD_REMIT_PATH,
        method: "POST",
        body,
      }),
      responseSchema: FundRemitResponseSchema,
    }),

    confirmFund: build.mutation<void, FundOutcomeRequest>({
      query: ({ quoteId, provider }) => ({
        url: fundOutcomePath(quoteId, "accepted"),
        method: "POST",
        body: { provider },
      }),
    }),

    cancelFund: build.mutation<void, FundCancelRequest>({
      query: ({ quoteId, provider, statusCode, errorMessage }) => ({
        url: fundOutcomePath(quoteId, "cancelled"),
        method: "POST",
        body: { provider, statusCode, errorMessage },
      }),
    }),
  }),
});

export type ExchangeFundManagementApi = typeof exchangeFundManagementApi;

export const { useRemitFundCardMutation, useConfirmFundMutation, useCancelFundMutation } =
  exchangeFundManagementApi;
