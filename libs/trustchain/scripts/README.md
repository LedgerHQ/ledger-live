### Run end 2 end tests and generate missing unit tests

```
pnpm trustchain e2e
```

This script will both run all end 2 end tests, and when not created yet, will bootstrap unit tests related to them by recording all APDUs, network calls and crypto randomness in order to play them deterministically in unit tests.
