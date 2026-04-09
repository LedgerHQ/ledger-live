/**
 * Bun preload: patch global namespace required by tronweb's protobuf CJS files.
 *
 * tronweb ships CJS protobuf-generated code that references `proto` and `goog` as globals.
 * Under Node.js these are set up by the main tronweb entry point; under Bun, ESM files have
 * their `require()` calls evaluated eagerly at module init time, so the globals aren't set
 * yet when the sub-modules are loaded. Wallet-CLI never uses Tron — this stub is enough to
 * prevent the crash without affecting any real behaviour.
 */

type Goog = { object: { extend: (...args: unknown[]) => void } };

const g = globalThis as Record<string, unknown>;

if (g["proto"] === undefined) {
  g["proto"] = {};
}
if (g["goog"] === undefined) {
  g["goog"] = { object: { extend: () => {} } } satisfies Goog;
}
