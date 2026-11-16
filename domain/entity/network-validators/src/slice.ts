import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NetworkId } from "@domain/entity-account-descriptor";
import type { NetworkValidator, NetworkValidatorsEntry, NetworkValidatorsError } from "./schema";

export type NetworkValidatorsState = Partial<Record<NetworkId, NetworkValidatorsEntry>>;

export const networkValidatorsInitialState = {} satisfies NetworkValidatorsState;

type Request = { networkId: NetworkId; requestId: string };

/** Keys come from action payloads: one inherited from `Object.prototype` is never a record entry. */
const isInheritedKey = (key: string) => key in Object.prototype;

const entryIn = (
  state: NetworkValidatorsState,
  networkId: NetworkId,
): NetworkValidatorsEntry | undefined => (isInheritedKey(networkId) ? undefined : state[networkId]);

/** A new entry without the read in flight: entries are replaced, never mutated through a payload key. */
const settled = ({
  validators,
  receivedAt,
  error,
}: NetworkValidatorsEntry): NetworkValidatorsEntry => ({
  validators,
  ...(receivedAt === undefined ? {} : { receivedAt }),
  ...(error === undefined ? {} : { error }),
});

export const networkValidatorsSlice = createSlice({
  name: "networkValidators",
  initialState: (): NetworkValidatorsState => networkValidatorsInitialState,
  reducers: {
    networkValidatorsRequested: (state, { payload }: PayloadAction<Request>) => {
      if (isInheritedKey(payload.networkId)) return;
      const entry = (state[payload.networkId] ??= { validators: [] });
      entry.pending = { requestId: payload.requestId };
    },
    networkValidatorsReceived: (
      state,
      { payload }: PayloadAction<Request & { validators: NetworkValidator[]; receivedAt: number }>,
    ) => {
      const entry = entryIn(state, payload.networkId);
      // Latest wins: an answer to a read a newer one replaced is dropped.
      if (entry?.pending?.requestId !== payload.requestId) return;
      state[payload.networkId] = { validators: payload.validators, receivedAt: payload.receivedAt };
    },
    networkValidatorsFailed: (
      state,
      { payload }: PayloadAction<Request & { error: NetworkValidatorsError }>,
    ) => {
      const entry = entryIn(state, payload.networkId);
      if (entry?.pending?.requestId !== payload.requestId) return;
      state[payload.networkId] = { ...settled(entry), error: payload.error };
    },
    networkValidatorsCancelled: (state, { payload }: PayloadAction<Request>) => {
      const entry = entryIn(state, payload.networkId);
      if (entry?.pending?.requestId !== payload.requestId) return;
      state[payload.networkId] = settled(entry);
    },
  },
  selectors: {
    selectNetworkValidatorsEntry: (
      state,
      networkId: NetworkId,
    ): NetworkValidatorsEntry | undefined => entryIn(state, networkId),
    selectNetworkValidators: (state, networkId: NetworkId): NetworkValidator[] | undefined =>
      entryIn(state, networkId)?.validators,
    selectNetworkValidator: (
      state,
      networkId: NetworkId,
      validatorId: string,
    ): NetworkValidator | undefined =>
      entryIn(state, networkId)?.validators.find(validator => validator.id === validatorId),
  },
});

export const {
  networkValidatorsRequested,
  networkValidatorsReceived,
  networkValidatorsFailed,
  networkValidatorsCancelled,
} = networkValidatorsSlice.actions;
export const { selectNetworkValidatorsEntry, selectNetworkValidators, selectNetworkValidator } =
  networkValidatorsSlice.selectors;
export default networkValidatorsSlice.reducer;
