import type { AccountDataSource } from "./port";

export type AccountDataSourceRegistry = {
  /** Register a source; call the returned function to unregister it (a kill switch, in practice). */
  register(source: AccountDataSource): () => void;
  /** Registered sources, highest priority first. */
  list(): readonly AccountDataSource[];
};

/**
 * Holds the sources an app has wired up.
 *
 * A registry instance rather than a module singleton: `features/platform` may not import `libs/`, so
 * every concrete source is built and registered by the app composition root, and tests get their own
 * registry instead of fighting over a global.
 */
export function createAccountDataSourceRegistry(
  initial: readonly AccountDataSource[] = [],
): AccountDataSourceRegistry {
  const sources = new Map<string, AccountDataSource>();
  const byPriority = () =>
    [...sources.values()].sort((a, b) => b.priority - a.priority) as readonly AccountDataSource[];

  const register = (source: AccountDataSource) => {
    sources.set(source.id, source);
    return () => {
      if (sources.get(source.id) === source) sources.delete(source.id);
    };
  };

  for (const source of initial) register(source);

  return { register, list: byPriority };
}
