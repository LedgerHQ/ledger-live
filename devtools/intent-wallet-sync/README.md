# @devtools/intent-wallet-sync

Runs the Ledger Sync device operations through the Device Intent Executor (DIE) and logs every job
state they emit:

- **Add member**: creates the trustchain or joins the existing one, with the connected device.
- **Remove member**: removes another instance from the trustchain, which rotates its key.

The host does the device work. It builds each intent from `@features/platform-intent-wallet-sync`,
mounts its own `DeviceIntentExecutor` with `sourceFlow="ledger_sync"`, writes the results to its
trustchain store, and passes the job states back as `log`. This tool only renders those props and
calls back the host.

The log holds the job state type and a short detail (failure reason, result type, root id). It never
holds keys or member credentials.

Imports no `@devtools/*` package, as any tool ([import boundaries](../../.agents/skills/devtools-import-boundary/SKILL.md)).
