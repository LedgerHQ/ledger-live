import { configureStore } from "@reduxjs/toolkit";
import authReducer, { INITIAL_STATE } from "../auth";
import {
  initializeAuthState,
  setLocked,
  setBiometricsError,
  setAuthModalOpen,
  lock,
  unlock,
} from "../../actions/auth";
import type { Privacy } from "../types";

const mockPrivacyWithoutPassword: Privacy = {
  hasPassword: false,
  biometricsEnabled: false,
  biometricsType: null,
};

describe("Auth Redux Implementation", () => {
  let store: ReturnType<typeof makeStore>;

  const makeStore = () =>
    configureStore({
      reducer: authReducer,
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
          serializableCheck: false,
        }),
    });

  beforeEach(() => {
    store = makeStore();
  });

  test("initial state is correct", () => {
    expect(store.getState()).toEqual(INITIAL_STATE);
  });

  test("initializeAuthState without password sets isLocked to false", () => {
    store.dispatch(initializeAuthState({ privacy: mockPrivacyWithoutPassword }));
    expect(store.getState().isLocked).toBe(false);
  });

  test("setLocked action updates isLocked state", () => {
    store.dispatch(setLocked(true));
    expect(store.getState().isLocked).toBe(true);

    store.dispatch(setLocked(false));
    expect(store.getState().isLocked).toBe(false);
  });

  test("setBiometricsError action updates biometricsError state", () => {
    const error = new Error("Biometrics failed");
    store.dispatch(setBiometricsError(error));
    expect(store.getState().biometricsError).toBe(error);

    store.dispatch(setBiometricsError(null));
    expect(store.getState().biometricsError).toBe(null);
  });

  test("setAuthModalOpen action updates authModalOpen state", () => {
    store.dispatch(setAuthModalOpen(true));
    expect(store.getState().authModalOpen).toBe(true);

    store.dispatch(setAuthModalOpen(false));
    expect(store.getState().authModalOpen).toBe(false);
  });

  test("lock action sets isLocked to true and clears biometricsError", () => {
    store.dispatch(setBiometricsError(new Error("test")));
    store.dispatch(lock());

    expect(store.getState().isLocked).toBe(true);
    expect(store.getState().biometricsError).toBe(null);
  });

  test("unlock action sets isLocked to false and clears biometricsError", () => {
    store.dispatch(setLocked(true));
    store.dispatch(setBiometricsError(new Error("test")));
    store.dispatch(unlock());

    expect(store.getState().isLocked).toBe(false);
    expect(store.getState().biometricsError).toBe(null);
  });
});
