import type { TypedStartListening } from "@reduxjs/toolkit";
import { selectFeature, type FeatureId, type WithFeatureFlags } from "@shared/feature-flags";
import {
  authEnvironmentSelector,
  setAuthEnvironment,
  type AuthEnvironment,
  type AuthEnvironmentState,
} from "./data";
import type { AuthProvider } from "./types";
import { AuthProviderUnavailableError } from "./errors";

export interface AuthApiExtra {
  readonly authProvider: AuthProvider;
}

export type AuthFeatureId = Extract<FeatureId, "lwdAuth" | "lwmAuth">;

export function authApiExtra<State extends StateWithAuthEnvironment>({
  startListening,
  authFeatureId,
  createAuthProvider,
}: AuthApiExtraOptions<State>): AuthApiExtra {
  let authEnabled = false;
  let provider: AuthProvider | undefined;

  startListening({
    predicate: action =>
      action.type.startsWith("featureFlags/") || setAuthEnvironment.match(action),
    effect(_action, listenerApi) {
      const state = listenerApi.getState();
      authEnabled = selectFeature(state, authFeatureId).enabled;
      if (!authEnabled || provider) return;
      const environment = authEnvironmentSelector(state);
      if (environment) {
        provider = createAuthProvider(environment);
      }
    },
  });

  return {
    authProvider: {
      withToken(options) {
        if (!authEnabled) return options.queryFn();
        if (!provider) throw new AuthProviderUnavailableError();
        return provider.withToken(options);
      },
    },
  };
}

export interface AuthApiExtraOptions<State extends StateWithAuthEnvironment> {
  startListening: TypedStartListening<State>;
  authFeatureId: AuthFeatureId;
  createAuthProvider(environment: AuthEnvironment): AuthProvider;
}

interface StateWithAuthEnvironment extends WithFeatureFlags {
  authEnvironment: AuthEnvironmentState;
}
