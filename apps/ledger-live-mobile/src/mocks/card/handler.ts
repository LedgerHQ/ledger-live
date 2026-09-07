import { http, HttpResponse } from "msw";
import { getMockCardOnboardingStatus } from "@domain/api-card-management/mock";

const handlers = [
  http.get("*/v1/card/onboarding-status", () => {
    return HttpResponse.json(getMockCardOnboardingStatus());
  }),
];

export default handlers;
