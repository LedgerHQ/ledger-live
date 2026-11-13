# @features/platform-device-intent-session

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

`useDeviceIntentSession` mounts the app's [Device Intent Executor](../device-intent/README.md) for one feature intent, so connect, open-app and the intent stay on one session.

It owns what every host of the executor repeats:

- builds the device initialization input (async) and reports when it is ready;
- remembers the last job state, so a user cancel can be mapped to an outcome;
- maps the job's last state and user cancel to an outcome, and calls `onExit` once;
- forwards job states and user cancel to a tracking callback.

It does not render anything and does not import an app. The flow package receives the app's `DeviceIntentExecutor` wrapper as an input and spreads the returned props on it, next to its `sourceFlow`.

## Usage

```tsx
const session = useDeviceIntentSession({
  buildSetupInput: () => buildDeviceInitializationInput(appRequest),
  intent: createIntent(definition, input),
  intentComponentExtraProps: undefined,
  outcomes: {
    fromJobState: jobState => (jobState.type === "verified" ? "verified" : undefined),
    fromUserCancel: lastJobState => (lastJobState?.type === "mismatch" ? "mismatch" : "dismissed"),
    setupFailed: "initFailed",
  },
  onTrack: event => {
    /* "jobStateChanged" or "userCancelled" */
  },
  onExit: outcome => {
    /* runs once: when the job completes on a mapped state, on user cancel, or when the setup fails */
  },
});

if (!session) return null;

return <DeviceIntentExecutor sourceFlow="receive" {...session} />;
```

`session` is `undefined` until `buildSetupInput` resolves.

## One session per mount

The hook reads `buildSetupInput` and `intent` once, on mount, and publishes them together. Changing them later has no effect, so the executor never runs an intent against a setup input that belongs to another one. To start a new session, remount the hook, for example with a React `key`.

## Behaviour

| Event                         | What the hook does                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------- |
| Job emits a state             | Tracks it, and remembers `outcomes.fromJobState(state)` for when the job completes       |
| Job completes                 | Exits with the remembered outcome. Without one, the session stays open for the user      |
| User cancels                  | Tracks it with the last job state. Exits with `outcomes.fromUserCancel(lastState)`        |
| `buildSetupInput` rejects     | Exits with `outcomes.setupFailed`                                                        |
| Anything after the first exit | Ignored                                                                                  |

The hook exits on job completion, not on a job state, so the job finishes and reports its result before the host unmounts the executor.

The executor's `onUserCancel` does not receive the last job state yet. The hook keeps it until `onUserCancel` runs, and can drop that once the executor passes it.
