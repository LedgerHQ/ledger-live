import { http, HttpResponse } from "msw";
import { CARD_API_BASE_URL } from "@support/msw-features-flow-pay-card";

export const CARD_STATUS_URL = `${CARD_API_BASE_URL}/v1/card/status`;
export const CARD_USER_URL = `${CARD_API_BASE_URL}/v1/user`;

export const CARD_STATUS = {
  id: "000000000050277836",
  holderName: "JOHN DOE",
  expiryDate: "2028/01",
  panLast4: "1234",
  status: "ACTIVE",
  type: "VIRTUAL",
  orderedAt: "2023-03-27T17:07:12.662Z",
} as const;

export const CARD_USER = {
  id: "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
  verificationState: "VERIFIED",
} as const;

export const signedInCardApiHandlers = [
  http.get(CARD_STATUS_URL, () => HttpResponse.json(CARD_STATUS)),
  http.get(CARD_USER_URL, () => HttpResponse.json(CARD_USER)),
];
