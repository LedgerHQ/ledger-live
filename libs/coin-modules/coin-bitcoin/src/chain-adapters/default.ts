import type { ChainAdapter } from "./types";

/**
 * No-op adapter used for all currencies that do not register a custom one
 * (Bitcoin, Litecoin, Dogecoin, Bitcoin Cash, etc.).
 */
export const defaultAdapter: ChainAdapter = {
  id: "default",
};
