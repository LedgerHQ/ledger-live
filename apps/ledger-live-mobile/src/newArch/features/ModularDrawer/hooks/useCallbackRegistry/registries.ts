import { Registry } from "./Registry";
import { AccountCallback } from "./types";

// Global registries that persist across re-renders
export const callbackRegistry = new Registry<AccountCallback>();

/**
 * Reset all registries - should be called during app reset/cleanup
 */
export const resetAllRegistries = () => {
  callbackRegistry.clear();
};
