import { configureStore, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AuthProviderMissingError } from "./errors";
import { createAuthMiddleware, getAuthProvider } from "./middleware";
import type { AuthProvider } from "./types";

const EXPECTED_TOKEN = { accessToken: "foo", tokenType: "Bearer" };

const authFeature = createSlice({
  name: "authFeature",
  initialState: { enabled: false },
  reducers: {
    setEnabled(state, { payload }: PayloadAction<boolean>) {
      state.enabled = payload;
    },
  },
});
const { setEnabled } = authFeature.actions;

type State = { authFeature: { enabled: boolean } };

describe("createAuthMiddleware", () => {
  const withToken = jest.fn(({ queryFn }) => queryFn(EXPECTED_TOKEN));
  const createAuthProvider = jest.fn((_getState: () => State): AuthProvider => ({ withToken }));
  const queryFn = jest.fn();

  function createStore() {
    return configureStore({
      reducer: { authFeature: authFeature.reducer },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(
          createAuthMiddleware<State>({
            createAuthProvider,
            isFeatureEnabled: state => state.authFeature.enabled,
          }),
        ),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call queries without a token while the feature is disabled", async () => {
    const store = createStore();

    await getAuthProvider(store.dispatch).withToken({ queryFn });

    expect(withToken).not.toHaveBeenCalled();
    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenNthCalledWith(1);
  });

  it("should delegate to the auth provider while the feature is enabled", async () => {
    const store = createStore();
    store.dispatch(setEnabled(true));

    await getAuthProvider(store.dispatch).withToken({ queryFn });

    expect(withToken).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledWith(EXPECTED_TOKEN);
  });

  it("should read the feature from the current state before every request", async () => {
    const store = createStore();
    const authProvider = getAuthProvider(store.dispatch);

    await authProvider.withToken({ queryFn });
    store.dispatch(setEnabled(true));
    await authProvider.withToken({ queryFn });
    store.dispatch(setEnabled(false));
    await authProvider.withToken({ queryFn });

    expect(withToken).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenNthCalledWith(1);
    expect(queryFn).toHaveBeenNthCalledWith(2, EXPECTED_TOKEN);
    expect(queryFn).toHaveBeenNthCalledWith(3);
  });

  it("should create the auth provider once, with the store state", () => {
    const store = createStore();

    getAuthProvider(store.dispatch);
    getAuthProvider(store.dispatch);

    expect(createAuthProvider).toHaveBeenCalledTimes(1);
    const [getState] = createAuthProvider.mock.calls[0];
    expect(getState()).toBe(store.getState());
  });

  it("should pass other actions on to the reducers", () => {
    const store = createStore();

    expect(store.dispatch(setEnabled(true))).toEqual(setEnabled(true));
    expect(store.getState().authFeature.enabled).toBe(true);
  });
});

describe("getAuthProvider", () => {
  it("should throw when the store has no auth middleware", () => {
    const store = configureStore({ reducer: { authFeature: authFeature.reducer } });

    expect(() => getAuthProvider(store.dispatch)).toThrow(AuthProviderMissingError);
  });
});
