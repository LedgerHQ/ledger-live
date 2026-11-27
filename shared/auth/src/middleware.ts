import type { Middleware, UnknownAction } from "@reduxjs/toolkit";
import { AuthProviderMissingError } from "./errors";
import { AuthProviderSchema, requestAuthProvider } from "./middleware.internals";
import type { AuthProvider } from "./types";

export interface AuthMiddlewareConfig<S> {
  /** Names this provider for a store that holds several; the default provider has no key. */
  key?: string;
  /** Called once, when the store is created. */
  createAuthProvider(getState: () => S): AuthProvider;
  /** Read before every request: while it returns false, requests go out without a token. */
  isFeatureEnabled(state: S): boolean;
}

/** Holds one of the store's {@link AuthProvider}s, which {@link getAuthProvider} reads by key. */
export function createAuthMiddleware<S = unknown>({
  key,
  createAuthProvider,
  isFeatureEnabled,
}: AuthMiddlewareConfig<S>): Middleware<object, S> {
  return ({ getState }) => {
    const authProvider = createAuthProvider(getState);
    const featureGatedAuthProvider: AuthProvider = {
      withToken(options) {
        if (!isFeatureEnabled(getState())) return options.queryFn();
        return authProvider.withToken(options);
      },
    };
    return next => action =>
      requestAuthProvider.match(action) && action.payload === key
        ? featureGatedAuthProvider
        : next(action);
  };
}

/**
 * Returns the provider of the store's auth middleware with this key, or the default one without a
 * key. That middleware answers this dispatch with it instead of passing the action on.
 */
export function getAuthProvider(
  dispatch: (action: UnknownAction) => unknown,
  key?: string,
): AuthProvider {
  const answer = AuthProviderSchema.safeParse(dispatch(requestAuthProvider(key)));
  if (!answer.success) throw new AuthProviderMissingError(key);
  return answer.data;
}
