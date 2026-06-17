import { z } from "zod";

export type AuthenticatedBaseQueryExtraOptions = {
  authenticated?: boolean;
};

// Keep the AuthSDK and KeycloakToken types in sync with @ledgerhq/ledger-auth until they are moved out of the monorepo
export const AuthSDKSchema = z.object({
  authenticate: z.custom<AuthSDK["authenticate"]>(value => typeof value === "function"),
});

export const AuthenticatedBaseQueryExtraSchema = z.object({ authSDK: AuthSDKSchema });

export interface AuthSDK {
  authenticate(forceRefresh?: boolean): Promise<KeycloakToken>;
}

export interface KeycloakToken {
  scope?: string;
  tokenType: string;
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
  refreshExpiresIn?: number;
}
