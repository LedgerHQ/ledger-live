import { buildHostedUrl } from "./buildHostedUrl";
import type { CardLoginOauthConfig } from "./types";

export const SIGNUP_PATH = "/onboarding/signup";

export function buildSignupUrl(oauthConfig: CardLoginOauthConfig): string {
  return buildHostedUrl(oauthConfig.hostedUiUrl, SIGNUP_PATH);
}
