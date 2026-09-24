# Opt-in integration tests

These tests talk to real services, so they are skipped unless you set the environment variables
below. CI never sets them.

## `agent-intent send` against a live Agent Intent service

`agent-intent-send.staging.test.ts` runs the real CLI against a live Agent Intent stack:
Keycloak/LKRP sign-in and the Agent Intent BFF of the profile's environment. Each run creates a real
**pending** intent that nobody approves. Nothing is signed or broadcast, but reject it in the
frontend afterwards.

The deployed test frontend (`https://agent-intent.ledger-test.com/`) currently talks to the
**production** service stack, so its enrollment completion is for `production`. Enroll with that
environment and point the handoff at the test frontend:

```bash
wallet-cli agent-intent enroll --profile <profile-id> --name "<name>" \
  --environment production --app-url https://agent-intent.ledger-test.com/
```

Open the printed link, approve it with a Ledger device, then pass the completion JSON the frontend
shows to `wallet-cli agent-intent complete --profile <profile-id>`. A `--environment staging`
profile only completes against a frontend wired to the staging service, which also needs the Ledger
infra VPN.

Prerequisites:

1. An Agent Intent profile, enrolled end to end on this machine as above. Its secret key must be in
   this machine's OS keychain.
2. An Ethereum address to use as sender (and, by default, recipient). Nothing is broadcast, so it
   doesn't need funds — but the frontend can only reject an intent it can craft, so an ERC-20 send
   from an address without that token balance stays pending until it expires.

Run it from `apps/wallet-cli`:

```bash
WALLET_CLI_AGENT_INTENT_STAGING_PROFILE=<profile-id> \
WALLET_CLI_AGENT_INTENT_STAGING_SENDER=<0x address> \
bun test src/test/integration/agent-intent-send.staging.test.ts
```

To also cover ERC-20, add `WALLET_CLI_AGENT_INTENT_STAGING_TOKEN=<contract>` and
`WALLET_CLI_AGENT_INTENT_STAGING_TOKEN_AMOUNT='<amount> <TICKER>'`, for example `'1 USDC'` with
the USDC mainnet contract.
