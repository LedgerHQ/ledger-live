import type { AuthProvider } from "./types";

export interface AuthApiExtra {
  readonly authProvider: AuthProvider;
}

export function authApiExtra({
  isFeatureEnabled,
  authProvider,
}: AuthApiExtraOptions): AuthApiExtra {
  return {
    authProvider: {
      withToken(options) {
        if (!isFeatureEnabled()) return options.queryFn();
        return authProvider.withToken(options);
      },
    },
  };
}

export interface AuthApiExtraOptions {
  isFeatureEnabled(): boolean;
  authProvider: AuthProvider;
}
