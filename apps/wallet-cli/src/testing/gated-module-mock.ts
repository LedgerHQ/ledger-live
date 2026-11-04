import { mock } from "bun:test";

type AnyFn = (...args: never[]) => unknown;

type GatedModuleMock<K extends string> = {
  /** Routes the members in `fakes` to them; the rest stay real. Call it in `beforeAll`. */
  activate(fakes: Partial<Record<K, AnyFn>>): void;
  /** Routes every member back to the real module. Call it in `afterAll`. */
  deactivate(): void;
};

const gatedMocks = new Map<
  string,
  { keys: readonly string[]; gated: Promise<GatedModuleMock<string>> }
>();

/**
 * `mock.module` for a module that other test files load too. Bun applies a module mock to every file
 * in the run and cannot undo it, so each member in `keys` calls the real export unless the calling
 * file has activated a fake for it.
 *
 * `modulePath` must be a package name or an absolute path (`require.resolve("./x")` in the caller):
 * a relative path would resolve against this file. One gated mock per module: a second one would
 * take the first one's wrappers for the real module, so a repeat call with the same keys (e.g. a
 * file run again by `bun test --rerun-each`) gets the first one back, and one with any other keys
 * throws, whichever file loads first.
 */
export async function createGatedModuleMock<K extends string>(
  modulePath: string,
  keys: readonly K[],
): Promise<GatedModuleMock<K>> {
  const existing = gatedMocks.get(modulePath);
  if (existing) {
    if (!sameKeySet(existing.keys, keys)) {
      throw new Error(
        `${modulePath} already has a gated mock for ${existing.keys.join(", ")}; share that one instead`,
      );
    }
    return existing.gated;
  }
  // Registered before the first await, so a concurrent call for the same module waits for this one.
  const gated = installGatedModuleMock(modulePath, keys);
  gatedMocks.set(modulePath, { keys, gated });
  return gated;
}

function sameKeySet(a: readonly string[], b: readonly string[]): boolean {
  const aSet = new Set(a);
  return aSet.size === new Set(b).size && b.every(key => aSet.has(key));
}

async function installGatedModuleMock<K extends string>(
  modulePath: string,
  keys: readonly K[],
): Promise<GatedModuleMock<K>> {
  // Copy the real exports first: mock.module re-binds the module namespace to the mock, so a
  // pass-through reading the namespace would call itself forever.
  const real = { ...(await import(modulePath)) } as Record<string, unknown>;
  let fakes: Partial<Record<K, AnyFn>> = {};

  mock.module(modulePath, () => ({
    ...real,
    ...Object.fromEntries(
      keys.map(key => [key, (...args: never[]) => (fakes[key] ?? (real[key] as AnyFn))(...args)]),
    ),
  }));

  return {
    activate(next) {
      fakes = next;
    },
    deactivate() {
      fakes = {};
    },
  };
}
