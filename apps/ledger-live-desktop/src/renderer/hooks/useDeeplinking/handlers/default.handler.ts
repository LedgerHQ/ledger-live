import { DeeplinkHandler } from "../types";

export const defaultHandler: DeeplinkHandler<"default"> = (
  _route,
  { navigate, tryRedirectToPostOnboardingOrRecover },
) => {
  if (!tryRedirectToPostOnboardingOrRecover()) {
    navigate("/");
  }
};
