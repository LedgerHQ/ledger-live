import { exchangeTransactionManagerApi } from "@shared/api-services";
import { CARD_FUND_REMIT_PATH, cardFundOutcomePath } from "./constants";
import { CardFundRemitResponseSchema } from "./schema";
import type {
  CardFundCancellation,
  CardFundConfirmation,
  CardFundRemitRequest,
  CardFundRemitResponse,
} from "./types";

export const cardFundingApi = exchangeTransactionManagerApi.injectEndpoints({
  endpoints: build => ({
    remitCardFund: build.mutation<CardFundRemitResponse, CardFundRemitRequest>({
      query: body => ({
        url: CARD_FUND_REMIT_PATH,
        method: "POST",
        body,
      }),
      responseSchema: CardFundRemitResponseSchema,
    }),
    confirmCardFund: build.mutation<void, CardFundConfirmation>({
      query: ({ orderId, ...body }) => ({
        url: cardFundOutcomePath(orderId, "accepted"),
        method: "POST",
        body,
      }),
    }),
    cancelCardFund: build.mutation<void, CardFundCancellation>({
      query: ({ orderId, ...body }) => ({
        url: cardFundOutcomePath(orderId, "cancelled"),
        method: "POST",
        body,
      }),
    }),
  }),
});

export const { useRemitCardFundMutation, useConfirmCardFundMutation, useCancelCardFundMutation } =
  cardFundingApi;
