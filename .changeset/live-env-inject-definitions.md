---
"@ledgerhq/live-env": major
---

**Breaking change**: all env API functions (`getEnv`, `setEnv`, `setEnvUnsafe`, `getEnvDefault`, `getAllEnvs`, `getAllEnvNames`, `getDefinition`, `getEnvDesc`, `isEnvDefault`) now throw if called before `injectDefinitions()`.

Previously, `@ledgerhq/live-env` bundled ~200 env var definitions and made them available on import. The definitions have been extracted into the new workspace-private `@shared/env` package. The framework layer (`@ledgerhq/live-env`) is now definition-free and requires an explicit bootstrap call.

**Migration for app consumers** — switch to `@shared/env` (recommended):

```ts
// before
import { getEnv } from "@ledgerhq/live-env";

// after
import { getEnv } from "@shared/env"; // auto-calls injectDefinitions at import time
```

**Migration for published libs** that need `@ledgerhq/live-env` directly (e.g. test setup):

```ts
import { injectDefinitions, stringParser } from "@ledgerhq/live-env";

injectDefinitions({ MY_VAR: { def: "default", parser: stringParser, desc: "..." } });
// now getEnv / setEnv work
```

New exports: `injectDefinitions`, `EnvDef<T>`, `EnvDefs`, `EnvChange`, and all parser helpers (`intParser`, `floatParser`, `boolParser`, `stringParser`, `jsonParser`, `stringArrayParser`).
