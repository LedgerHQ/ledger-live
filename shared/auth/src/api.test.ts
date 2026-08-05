import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import { featureFlagsReducer, setOverride, type FeatureFlagsState } from "@shared/feature-flags";
import { authEnvironmentReducer, setAuthEnvironment, type AuthEnvironmentState } from "./data";
import { authApiExtra } from "./api";
import { AuthProviderUnavailableError } from "./errors";
import type { AuthProvider } from "./types";

type State = {
  authEnvironment: AuthEnvironmentState;
  featureFlags: FeatureFlagsState;
};

const EXPECTED_TOKEN = { accessToken: "foo", tokenType: "Bearer" };

describe("authApiExtra", () => {
  const createAuthProvider = jest.fn(
    (): AuthProvider => ({ withToken: ({ queryFn }) => queryFn(EXPECTED_TOKEN) }),
  );
  const queryFn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should bypass authentication for unrelated actions and the other platform flag", async () => {
    const listenerMiddleware = createListenerMiddleware<State>();
    const { authProvider } = authApiExtra({
      startListening: listenerMiddleware.startListening,
      authFeatureId: "lwdAuth",
      providerParams: undefined,
      createAuthProvider,
    });
    const store = configureStore({
      reducer: {
        authEnvironment: authEnvironmentReducer,
        featureFlags: featureFlagsReducer,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    });

    store.dispatch(setAuthEnvironment("PROD"));
    store.dispatch(setOverride({ key: "lwmAuth", value: { enabled: true } }));
    store.dispatch({ type: "unrelated/action" });

    await authProvider.withToken({ queryFn });
    expect(createAuthProvider).not.toHaveBeenCalled();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenNthCalledWith(1);
  });

  it("should initialize, bypass, and reuse the provider as configuration changes", async () => {
    const listenerMiddleware = createListenerMiddleware<State>();
    const { authProvider } = authApiExtra({
      startListening: listenerMiddleware.startListening,
      authFeatureId: "lwdAuth",
      providerParams: undefined,
      createAuthProvider,
    });
    const store = configureStore({
      reducer: {
        authEnvironment: authEnvironmentReducer,
        featureFlags: featureFlagsReducer,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    });

    store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));
    expect(() => authProvider.withToken({ queryFn })).toThrow(AuthProviderUnavailableError);
    expect(createAuthProvider).not.toHaveBeenCalled();
    expect(queryFn).not.toHaveBeenCalled();

    store.dispatch(setAuthEnvironment("PROD"));
    await authProvider.withToken({ queryFn });
    expect(createAuthProvider).toHaveBeenCalledTimes(1);
    expect(createAuthProvider).toHaveBeenCalledWith("PROD", undefined);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenNthCalledWith(1, EXPECTED_TOKEN);

    store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: false } }));
    await authProvider.withToken({ queryFn });
    expect(createAuthProvider).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(queryFn).toHaveBeenNthCalledWith(2);

    store.dispatch(setAuthEnvironment("STAGING"));
    store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));
    await authProvider.withToken({ queryFn });
    expect(createAuthProvider).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledTimes(3);
    expect(queryFn).toHaveBeenNthCalledWith(3, EXPECTED_TOKEN);
  });

  it("should create the provider when authentication is enabled after the environment is set", async () => {
    const listenerMiddleware = createListenerMiddleware<State>();
    const { authProvider } = authApiExtra({
      startListening: listenerMiddleware.startListening,
      authFeatureId: "lwdAuth",
      providerParams: undefined,
      createAuthProvider,
    });
    const store = configureStore({
      reducer: {
        authEnvironment: authEnvironmentReducer,
        featureFlags: featureFlagsReducer,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().prepend(listenerMiddleware.middleware),
    });

    store.dispatch(setAuthEnvironment("STAGING"));
    store.dispatch(setOverride({ key: "lwdAuth", value: { enabled: true } }));

    await authProvider.withToken({ queryFn });
    expect(createAuthProvider).toHaveBeenCalledTimes(1);
    expect(createAuthProvider).toHaveBeenCalledWith("STAGING", undefined);
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenNthCalledWith(1, EXPECTED_TOKEN);
  });
});
