import { buildHostedUrl } from "./buildHostedUrl";
import { SIGNUP_PATH } from "./hostedPaths";
import type { CardLoginOauthConfig } from "./types";

export function buildSignupUrl(oauthConfig: CardLoginOauthConfig): string {
  return buildHostedUrl(oauthConfig.hostedUiUrl, SIGNUP_PATH);
}
