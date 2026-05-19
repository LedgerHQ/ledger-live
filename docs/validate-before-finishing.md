# Validation Before Finishing

Before finishing any agentic code change, run for the affected scope:

1. `pnpm [app/filter] typecheck`
2. `pnpm [app/filter] test:jest` (or `test --watch` for libs)

If typecheck fails with an import error from a local lib, rebuild that lib:

```bash
pnpm turbo build --filter=@ledgerhq/<lib-name>
```
