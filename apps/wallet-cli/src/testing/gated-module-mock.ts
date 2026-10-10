import { mock } from "bun:test";

type AnyFn = (...args: never[]) => unknown;

type GatedModuleMock<K extends string> = {
  /** Routes the members in `fakes` to them; the rest stay real. Call it in `beforeAll`. */
  activate(fakes: Partial<Record<K, AnyFn>>): void;
  /** Routes every member back to the real module. Call it in `afterAll`. */
  deactivate(): void;
};

const gatedPaths = new Set<string>();

/**
 * `mock.module` for a module that other test files load too. Bun applies a module mock to every file
 * in the run and cannot undo it, so each member in `keys` calls the real export unless the calling
 * file has activated a fake for it.
 *
 * `modulePath` must be a package name or an absolute path (`require.resolve("./x")` in the caller):
 * a relative path would resolve against this file. One gated mock per module: a second one would
 * take the first one's wrappers for the real module.
 */
export async function createGatedModuleMock<K extends string>(
  modulePath: string,
  keys: readonly K[],
): Promise<GatedModuleMock<K>> {
  if (gatedPaths.has(modulePath)) {
    throw new Error(`${modulePath} already has a gated mock; share that one instead`);
  }
  gatedPaths.add(modulePath);
  // Copy the real exports first: mock.module re-binds the module namespace to the mock, so a
  // pass-through reading the namespace would call itself forever.
  const real = { ...(await import(modulePath)) } as Record<string, unknown>;
  let fakes: Partial<Record<K, AnyFn>> = {};

  const install = () =>
    mock.module(modulePath, () => ({
      ...real,
      ...Object.fromEntries(
        keys.map(key => [key, (...args: never[]) => (fakes[key] ?? (real[key] as AnyFn))(...args)]),
      ),
    }));
  install();

  return {
    activate(next) {
      fakes = next;
      // Again in case another file's mock.module replaced this one since.
      install();
    },
    deactivate() {
      fakes = {};
    },
  };
}
