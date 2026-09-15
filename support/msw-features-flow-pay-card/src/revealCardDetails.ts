import { http, HttpResponse } from "msw";
import { CARD_API_BASE_URL } from "./cardApiStore";

export const CARD_DETAILS_TOKEN_URL = `${CARD_API_BASE_URL}/v1/card/details/token`;

export const CARD_DETAILS_TOKEN = "00000000-0000-4000-8000-000000000000";

/** The schema only accepts an `https:` URL, so the mock image lives under the mock API host. */
export const CARD_DETAILS_IMAGE_URL = `${CARD_API_BASE_URL}/details-image?token=${CARD_DETAILS_TOKEN}`;

export const CARD_DETAILS = {
  token: CARD_DETAILS_TOKEN,
  imageUrl: CARD_DETAILS_IMAGE_URL,
};

export const revealCardDetailsHandler = http.post(CARD_DETAILS_TOKEN_URL, () =>
  HttpResponse.json(CARD_DETAILS),
);

export const revealCardDetailsFailureHandler = http.post(CARD_DETAILS_TOKEN_URL, () =>
  HttpResponse.json({ message: "mint failed" }, { status: 500 }),
);
