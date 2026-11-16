import { createAsyncThunk } from "@reduxjs/toolkit";
import { z } from "zod";
import type { NetworkId } from "@domain/entity-account-descriptor";
import {
  NetworkValidatorSchema,
  networkValidatorsCancelled,
  networkValidatorsFailed,
  networkValidatorsReceived,
  networkValidatorsRequested,
  selectNetworkValidatorsEntry,
  type NetworkValidator,
  type NetworkValidatorsState,
} from "@domain/entity-network-validators";
import { NoNetworkValidatorsSourceError } from "./errors";
import { getNetworkValidatorsSources } from "./extra";

export const DEFAULT_NETWORK_VALIDATORS_MAX_AGE = 5 * 60_000;

export type NetworkValidatorsRootState = { networkValidators: NetworkValidatorsState };

export type FetchNetworkValidatorsOptions = {
  /** Reads whatever the age, replacing a read in flight. */
  refresh?: boolean;
  /** Validators read more recently than this are not read again. */
  maxAge?: number;
};

const ValidatorsSchema = z.array(NetworkValidatorSchema);

const errorOf = (error: unknown) =>
  error instanceof Error
    ? { name: error.name, message: error.message }
    : { name: "Error", message: String(error) };

const fetchNetworkValidatorsThunk = createAsyncThunk<
  { validators: NetworkValidator[]; sourceId: string },
  { networkId: NetworkId } & FetchNetworkValidatorsOptions,
  { state: NetworkValidatorsRootState }
>(
  "networkValidators/fetch",
  async ({ networkId }, { dispatch, extra, requestId, signal }) => {
    const sources = getNetworkValidatorsSources(extra).filter(source => source.supports(networkId));
    dispatch(networkValidatorsRequested({ networkId, requestId }));
    const cancel = () => dispatch(networkValidatorsCancelled({ networkId, requestId }));
    signal.addEventListener("abort", cancel, { once: true });
    try {
      let lastError: unknown = new NoNetworkValidatorsSourceError(networkId);
      // On a failure, the next ranked source is asked.
      for (const source of sources) {
        try {
          const validators = ValidatorsSchema.parse(await source.read(networkId, { signal }));
          signal.throwIfAborted();
          dispatch(
            networkValidatorsReceived({ networkId, requestId, validators, receivedAt: Date.now() }),
          );
          return { validators, sourceId: source.id };
        } catch (error) {
          if (signal.aborted) throw error;
          lastError = error;
        }
      }
      dispatch(networkValidatorsFailed({ networkId, requestId, error: errorOf(lastError) }));
      throw lastError;
    } finally {
      signal.removeEventListener("abort", cancel);
    }
  },
  {
    condition: (
      { networkId, refresh = false, maxAge = DEFAULT_NETWORK_VALIDATORS_MAX_AGE },
      { getState },
    ) => {
      if (refresh) return true;
      const entry = selectNetworkValidatorsEntry(getState(), networkId);
      if (entry?.pending) return false;
      const age = entry?.receivedAt === undefined ? undefined : Date.now() - entry.receivedAt;
      // A stamp from the future is a clock that moved, not a fresh read.
      return age === undefined || age < 0 || age >= maxAge;
    },
  },
);

/** Reads a network's validators from the first ranked source serving it, unless fresh or in flight. */
export const fetchNetworkValidators = (
  networkId: NetworkId,
  options: FetchNetworkValidatorsOptions = {},
) => fetchNetworkValidatorsThunk({ networkId, ...options });
