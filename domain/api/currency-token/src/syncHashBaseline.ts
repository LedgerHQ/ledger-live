import { syncHashBaselineSlice } from "./internals/syncHashBaseline";

/**
 * Reducer to register in the app store under {@link SYNC_HASH_BASELINE_REDUCER_PATH}. Without it,
 * persistence falls back to the fulfilled hash queries only.
 */
export const syncHashBaselineReducer = syncHashBaselineSlice.reducer;

/** The store key under which {@link syncHashBaselineReducer} must be registered. */
export const SYNC_HASH_BASELINE_REDUCER_PATH = syncHashBaselineSlice.name;
