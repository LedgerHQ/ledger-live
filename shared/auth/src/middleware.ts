import type { Middleware, UnknownAction } from "@reduxjs/toolkit";
import { AuthProviderMissingError } from "./errors";
import { AuthProviderSchema, requestAuthProvider } from "./middleware.internals";
import type { AuthProvider } from "./types";

export interface AuthMiddlewareConfig<S> {
  /** Called once, when the store is created. */
  createAuthProvider(getState: () => S): AuthProvider;
  /** Read before every request: while it returns false, requests go out without a token. */
  isFeatureEnabled(state: S): boolean;
}

/** Holds the store's {@link AuthProvider}, which {@link getAuthProvider} reads. */
export function createAuthMiddleware<S = unknown>({
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
      requestAuthProvider.match(action) ? featureGatedAuthProvider : next(action);
  };
}

/**
 * Returns the provider of the store's auth middleware, which answers this dispatch with it instead
 * of passing the action on.
 */
export function getAuthProvider(dispatch: (action: UnknownAction) => unknown): AuthProvider {
  const answer = AuthProviderSchema.safeParse(dispatch(requestAuthProvider()));
  if (!answer.success) throw new AuthProviderMissingError();
  return answer.data;
}
