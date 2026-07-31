import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthEnvironment = "STAGING" | "PROD";
export type AuthEnvironmentState = AuthEnvironment | null;

const getInitialState = (): AuthEnvironmentState => null;

/**
 * Temporary bridge between Wallet Sync components that resolve service environments independently.
 * The process-lifetime Trustchain SDK and cached auth provider capture API URLs when created, so
 * auth must currently reuse the environment selected by the first Trustchain SDK instance.
 * Remove once Wallet Sync has a unified environment source and long-lived SDK/provider instances
 * can be recreated or reconfigured dynamically.
 */
const authEnvironmentSlice = createSlice({
  name: "authEnvironment",
  initialState: getInitialState(),
  reducers: {
    setAuthEnvironment: (_state, action: PayloadAction<AuthEnvironment>) => action.payload,
  },
  selectors: {
    authEnvironmentSelector: state => state,
  },
});

export const { setAuthEnvironment } = authEnvironmentSlice.actions;
export const { authEnvironmentSelector } = authEnvironmentSlice.selectors;
export const authEnvironmentReducer = authEnvironmentSlice.reducer;
