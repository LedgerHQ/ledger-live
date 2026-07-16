### Run end 2 end tests and generate missing integration tests

the e2e script will run all end 2 end tests and record the APDUs, network calls and crypto randomness in order to replay them deterministically in integration tests.

Just run the tests that miss snapshot mocks.

```
pnpm lkrp e2e
```

Run all the end2end tests regardless if there are snapshot generated.

```
RUN_EVEN_IF_SNAPSHOT_EXISTS=1 pnpm lkrp e2e
```

### Test the Keycloak authentication flow via the LKRP identity provider

This script requires member credentials associated with a trustchain.

```shell
# Pipe your credentials as JSON to the script:
echo '{
  "trustchainId": "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
  "pubkey": "02000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f",
  "privatekey": "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f"
}' | pnpm lkrp keycloak-auth

# Or run the script and paste your credentials when prompted:
pnpm lkrp keycloak-auth
```
