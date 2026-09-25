import { cardApi } from "@shared/api-services";
import { CARD_TOP_UP_PAYLOAD_PATH } from "./constants";
import { readCardTopUpPayload } from "./transforms";
import type { CardTopUpPayloadRequest, CardTopUpSignedPayload } from "./types";

export const cardTopUpPayloadApi = cardApi.injectEndpoints({
  endpoints: build => ({
    /**
     * Asks the provider to sign a Fund payload bound to the device nonce, on the Card session.
     *
     * The payload names the cardholder, so the caller resets the mutation once it has been used
     * rather than leaving it in `state.cardApi.mutations`.
     */
    requestCardTopUpPayload: build.mutation<CardTopUpSignedPayload, CardTopUpPayloadRequest>({
      async queryFn(body, _api, _extraOptions, baseQuery) {
        const answer = await baseQuery({ url: CARD_TOP_UP_PAYLOAD_PATH, method: "POST", body });
        return answer.error ? { error: answer.error } : readCardTopUpPayload(answer.data);
      },
      extraOptions: { api: "legacy" },
    }),
  }),
});

export const { useRequestCardTopUpPayloadMutation } = cardTopUpPayloadApi;
