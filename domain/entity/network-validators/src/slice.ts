import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NetworkId } from "@domain/entity-account-descriptor";
import type { NetworkValidator, NetworkValidatorsEntry, NetworkValidatorsError } from "./schema";

export type NetworkValidatorsState = Partial<Record<NetworkId, NetworkValidatorsEntry>>;

export const networkValidatorsInitialState = {} satisfies NetworkValidatorsState;

type Request = { networkId: NetworkId; requestId: string };

const entryOf = (state: NetworkValidatorsState, networkId: NetworkId): NetworkValidatorsEntry =>
  (state[networkId] ??= { validators: [] });

export const networkValidatorsSlice = createSlice({
  name: "networkValidators",
  initialState: (): NetworkValidatorsState => networkValidatorsInitialState,
  reducers: {
    networkValidatorsRequested: (state, { payload }: PayloadAction<Request>) => {
      entryOf(state, payload.networkId).pending = { requestId: payload.requestId };
    },
    networkValidatorsReceived: (
      state,
      { payload }: PayloadAction<Request & { validators: NetworkValidator[]; receivedAt: number }>,
    ) => {
      const entry = state[payload.networkId];
      // Latest wins: an answer to a read a newer one replaced is dropped.
      if (entry?.pending?.requestId !== payload.requestId) return;
      state[payload.networkId] = { validators: payload.validators, receivedAt: payload.receivedAt };
    },
    networkValidatorsFailed: (
      state,
      { payload }: PayloadAction<Request & { error: NetworkValidatorsError }>,
    ) => {
      const entry = state[payload.networkId];
      if (entry?.pending?.requestId !== payload.requestId) return;
      delete entry.pending;
      entry.error = payload.error;
    },
  },
  selectors: {
    selectNetworkValidatorsEntry: (
      state,
      networkId: NetworkId,
    ): NetworkValidatorsEntry | undefined => state[networkId],
    selectNetworkValidators: (state, networkId: NetworkId): NetworkValidator[] | undefined =>
      state[networkId]?.validators,
    selectNetworkValidator: (
      state,
      networkId: NetworkId,
      validatorId: string,
    ): NetworkValidator | undefined =>
      state[networkId]?.validators.find(validator => validator.id === validatorId),
  },
});

export const { networkValidatorsRequested, networkValidatorsReceived, networkValidatorsFailed } =
  networkValidatorsSlice.actions;
export const { selectNetworkValidatorsEntry, selectNetworkValidators, selectNetworkValidator } =
  networkValidatorsSlice.selectors;
export default networkValidatorsSlice.reducer;
