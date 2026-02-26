// Re-export all types from the new types folder for backward compatibility
export * from "./types/index";

// Re-export AlgorandResourcesBridge as AlgorandResources for backward compatibility
export type { AlgorandResourcesBridge as AlgorandResources } from "./types/bridge";
