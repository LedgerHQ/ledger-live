---
"@ledgerhq/esm-fix-extensions": minor
---

Add @ledgerhq/esm-fix-extensions: a post-build tool that makes a `tsc --moduleResolution bundler` ESM output (`lib-es`) loadable by Node's native ESM resolver — adds explicit relative import extensions, injects `createRequire`/`__dirname` shims for surviving CJS globals, and writes a `{ "type": "module" }` marker. Proven mechanism for LIVE-31760 (validated on the device-core graph); not yet wired into lib builds.
