import { ScriptManager, Script } from "@callstack/repack/client";

/**
 * Registers the resolver the Re.Pack runtime uses to locate the async chunks the
 * host emits — lazy coin-family setups, viem, polkadot, and the Portfolio's
 * `import("swap/HelloWorld")` federated remote. Without it, every `import()`
 * fails at runtime with "No resolver was able to resolve script".
 *
 * The Module Federation runtime registers its own resolver at the default
 * priority (2) scoped to the `swap` remote and its chunks. We register at a
 * lower priority (1) so the federation resolver always runs first for `swap`
 * scripts and this one only ever resolves the host's own chunks.
 *
 * Must run before the first `import()` resolves (i.e. before first render),
 * which is why this module is imported at the very top of `index.js`.
 */
ScriptManager.shared.addResolver(
  async scriptId => {
    if (__DEV__) {
      // Dev: chunks are served on demand by the Re.Pack dev server.
      return { url: Script.getDevServerURL(scriptId), cache: false };
    }
    // Release: chunks are shipped inside the app bundle on the filesystem.
    return { url: Script.getFileSystemURL(scriptId) };
  },
  { priority: 1 },
);
