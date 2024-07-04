### Run end 2 end tests and generate missing integration tests

the e2e script will run all end 2 end tests and record the APDUs, network calls and crypto randomness in order to replay them deterministically in integration tests.

Just run the tests that miss snapshot mocks.

```
pnpm trustchain e2e
```

Run all the end2end tests regardless if there are snapshot generated.

```
RUN_EVEN_IF_SNAPSHOT_EXISTS=1 pnpm trustchain e2e
```
