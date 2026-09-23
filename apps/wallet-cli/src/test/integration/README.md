# Opt-in integration tests

These tests talk to real services, so they are skipped unless you set the environment variables
below. CI never sets them.

## `agent-intent send` against staging

`agent-intent-send.staging.test.ts` runs the real CLI against the Agent Intent staging stack:
Keycloak/LKRP sign-in and the Agent Intent BFF. Each run creates a real **pending** intent that
nobody approves. Reject it in the frontend afterwards.

Prerequisites:

1. A **staging** Agent Intent profile, enrolled end to end on this machine:
   `agent-intent enroll --environment staging` → approve the link in the staging frontend with a
   Ledger device → `agent-intent complete`. Its secret key must be in this machine's OS keychain.
2. Network access to `global.api.stg.ledger-test.com` (connect to the VPN if your network requires
   it).
3. An Ethereum address to use as sender (and, by default, recipient). Nothing is broadcast, so it
   doesn't need funds.

Run it from `apps/wallet-cli`:

```bash
WALLET_CLI_AGENT_INTENT_STAGING_PROFILE=<profile-id> \
WALLET_CLI_AGENT_INTENT_STAGING_SENDER=<0x address> \
bun test src/test/integration/agent-intent-send.staging.test.ts
```

To also cover ERC-20, add `WALLET_CLI_AGENT_INTENT_STAGING_TOKEN=<contract>` and
`WALLET_CLI_AGENT_INTENT_STAGING_TOKEN_AMOUNT='<amount> <TICKER>'`, for example `'1 USDC'` with
the USDC mainnet contract.
