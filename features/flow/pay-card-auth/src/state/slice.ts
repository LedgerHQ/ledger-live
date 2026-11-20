import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PayCardAuthStatus } from "./hostTypes";
import type { PayCardAuthState } from "./types";

export const payCardAuthInitialState: PayCardAuthState = {
  hasCard: false,
  pendingLoginType: null,
  status: "unknown",
  isSessionResolving: false,
};

export const payCardAuthSlice = createSlice({
  name: "payCardAuth",
  initialState: payCardAuthInitialState,
  reducers: {
    setHasCard: (state, action: PayloadAction<boolean>) => {
      state.hasCard = action.payload;
    },
    setPendingLoginType: (state, action: PayloadAction<PayCardAuthState["pendingLoginType"]>) => {
      state.pendingLoginType = action.payload;
    },
    /**
     * Written by the login machine, and by `More` once a logout is through. It is runtime
     * state, not a preference, so the slice must stay out of the persisted app state. The boolean
     * maps onto the tri-state: a machine can only report the two resolved outcomes, never `unknown`.
     */
    setSignedIn: (state, action: PayloadAction<boolean>) => {
      state.status = action.payload ? "signedIn" : "signedOut";
    },
    setSessionResolving: (state, action: PayloadAction<boolean>) => {
      state.isSessionResolving = action.payload;
    },
  },
  selectors: {
    selectPayCardAuth: (state): PayCardAuthState => state,
    selectHasCard: (state): boolean => state.hasCard,
    selectPendingLoginType: (state): PayCardAuthState["pendingLoginType"] => state.pendingLoginType,
    /**
     * Where the Card session stands. Hosts that must tell "still resolving" from "signed out" read this;
     * everything that only cares whether a session is live reads {@link selectIsSignedIn}.
     */
    selectCardAuthStatus: (state): PayCardAuthStatus => state.status,
    selectIsCardSessionResolving: (state): boolean => state.isSessionResolving,
    /** True while a Card session is live. `CardLogin` hides on it, and `More` shows on it. */
    selectIsSignedIn: (state): boolean => state.status === "signedIn",
  },
});

export const { setHasCard, setPendingLoginType, setSessionResolving, setSignedIn } =
  payCardAuthSlice.actions;

export const {
  selectPayCardAuth,
  selectHasCard,
  selectPendingLoginType,
  selectCardAuthStatus,
  selectIsCardSessionResolving,
  selectIsSignedIn,
} = payCardAuthSlice.selectors;
