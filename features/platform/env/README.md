# @features/platform-env

React hook for subscribing to typed env var changes in Ledger Live apps.

## Usage

```ts
import useEnv from "@features/platform-env";

function MyComponent() {
  const isMock = useEnv("MOCK"); // string (seed value, empty by default)
  const calUrl = useEnv("CAL_SERVICE_URL"); // string
  // ...
}
```

The hook is reactive: it re-renders when the env var changes via `setEnv` / `setEnvUnsafe`.

## Type safety

Return type is fully inferred from the definition in `@shared/env`:

```ts
useEnv("MOCK")               // string (seed value, empty by default)
useEnv("GET_CALLS_TIMEOUT")  // number
useEnv("CAL_SERVICE_URL")    // string
```
