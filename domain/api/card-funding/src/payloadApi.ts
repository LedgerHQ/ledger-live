import { cardApi } from "@shared/api-services";
import { CARD_FUND_PAYLOAD_PATH } from "./constants";
import { readCardFundPayload } from "./transforms";
import type { CardFundPayloadRequest, CardFundSignedPayload } from "./types";

export const cardFundPayloadApi = cardApi.injectEndpoints({
  endpoints: build => ({
    /**
     * Asks the provider to sign a Fund payload bound to the device nonce, on the Card session.
     *
     * The payload names the cardholder, so the caller resets the mutation once it has been used
     * rather than leaving it in `state.cardApi.mutations`.
     */
    requestCardFundPayload: build.mutation<CardFundSignedPayload, CardFundPayloadRequest>({
      async queryFn({ apiBaseUrl, ...body }, _api, _extraOptions, baseQuery) {
        const answer = await baseQuery({
          url: `${apiBaseUrl}${CARD_FUND_PAYLOAD_PATH}`,
          method: "POST",
          body,
        });
        return answer.error ? { error: answer.error } : readCardFundPayload(answer.data);
      },
    }),
  }),
});

export const { useRequestCardFundPayloadMutation } = cardFundPayloadApi;
