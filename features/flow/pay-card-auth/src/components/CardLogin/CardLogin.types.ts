import type { ReactNode } from "react";
import type {
  CardLoginOauthConfig,
  OpenCardHostedPage,
  OpenHostedLogin,
  PayCardAuthCallback,
} from "../../state/hostTypes";

/**
 * Asks the host to make sure the app is protected, resolving true once it is. The card is the
 * reason the mobile app lock exists, so neither path to Baanx runs while it is unprotected. Only
 * the native entry passes this: desktop has no app lock, leaves it out, and carries on as before.
 */
type RequestAppProtection = () => Promise<boolean>;

export type CardLoginProps = {
  readonly children?: ReactNode;
  readonly oauthConfig: CardLoginOauthConfig;
  /**
   * The redirect the app received, when it has one. The app's router owns the deep link, so it hands
   * the flow the `code` and `state` it already parsed.
   */
  readonly callback?: PayCardAuthCallback | null;
  readonly openHostedLogin?: OpenHostedLogin;
  readonly openHostedPage?: OpenCardHostedPage;
  readonly requestProtection?: RequestAppProtection;
  readonly keepLoginPage?: boolean;
  readonly onCreateAccount?: () => void;
  readonly onLogIn?: () => void;
};
