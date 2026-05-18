import type { ChainAdapter } from "./types";
import { defaultAdapter } from "./default";

const adapters = new Map<string, ChainAdapter>();

export function registerChainAdapter(adapter: ChainAdapter): void {
  adapters.set(adapter.id, adapter);
}

export function getChainAdapter(currencyId: string): ChainAdapter {
  return adapters.get(currencyId) ?? defaultAdapter;
}
