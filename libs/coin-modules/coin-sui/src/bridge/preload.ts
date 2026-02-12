import { setSuiPreloadData } from "../network/preload-data";
import { getValidators } from "../network/sdk";
import type { SuiPreloadData } from "../types";

const PRELOAD_MAX_AGE = 30 * 60 * 1000; // 30 minutes

export const getPreloadStrategy = () => ({
  preloadMaxAge: PRELOAD_MAX_AGE,
});

export const preload = async (): Promise<SuiPreloadData> => {
  const validators = await getValidators();
  return { validators, tokens: [] };
};

export const hydrate = (data: SuiPreloadData) => {
  if (data) {
    setSuiPreloadData({
      validators: data.validators ?? [],
      tokens: [],
    });
  }
};

export { getCurrentSuiPreloadData } from "../network/preload-data";
