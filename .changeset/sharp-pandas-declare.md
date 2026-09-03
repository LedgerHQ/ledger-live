---
"@ledgerhq/live-env": major
---

Remove the `EnvTypes` registry

`injectDefinitions()` already moved every env-var default out of the framework, but `EnvTypes` stayed behind and kept the full list of env names and their types inside the library. It is gone, along with the `EnvName` / `EnvValue` exports and the typed `getEnv` / `setEnv` / `getEnvDefault` overloads built on it.

`getEnv(name)` and `getEnvDefault(name)` now return `any`, so existing call sites keep compiling. A consumer that wants typing declares the vars it reads and wraps the accessor:

```ts
import { getEnv as getEnvUnsafe } from "@ledgerhq/live-env";

type Envs = { MY_TIMEOUT: number; MY_API_URL: string };

export const getEnv = <K extends keyof Envs>(name: K): Envs[K] => getEnvUnsafe(name);
```
