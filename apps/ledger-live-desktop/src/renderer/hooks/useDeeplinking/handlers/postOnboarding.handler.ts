import { DeeplinkHandler } from "../types";

export const postOnboardingHandler: DeeplinkHandler<"post-onboarding"> = (
  route,
  { postOnboardingDeeplinkHandler },
) => {
  postOnboardingDeeplinkHandler(route.device);
};
