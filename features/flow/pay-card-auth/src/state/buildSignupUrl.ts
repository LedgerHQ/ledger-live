import type { CardLoginOauthConfig } from "./types";

const SIGNUP_PATH = "/onboarding/signup";

export function buildSignupUrl(oauthConfig: CardLoginOauthConfig): string {
  const url = new URL(SIGNUP_PATH, oauthConfig.hostedUiUrl);

  if (url.protocol !== "https:") {
    throw new Error(`buildSignupUrl: hostedUiUrl must be https, got "${url.protocol}"`);
  }

  return url.toString();
}
