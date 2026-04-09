import { registryActions } from "./registries";
import { RegistryManager } from "./types";

/**
 * Hook that returns referentially-stable callback registry actions.
 */

export const useCallbackRegistry = (): RegistryManager => registryActions;
