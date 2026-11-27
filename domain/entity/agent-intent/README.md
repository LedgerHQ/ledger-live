# @domain/entity-agent-intent

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

What Ledger Wallet reads from and sends to the Agent Intent BFF, as Zod schemas: intents an agent
asks the user to approve, the transaction the BFF crafts for one, the signature the user sends
back, agent profiles and intent counts.

- `schema.ts`: the schemas, with branded ids (`AgentIntentId`, `AgentPubkey`) and branded
  signing values (`AgentIntentRawTransaction`, `AgentIntentSignature`).
- `types.ts`: the inferred types.
- `constants.ts`: pending and history status groups, agent profile limits.
- `schema.mock.ts` (`@domain/entity-agent-intent/schema.mock`): one valid value per schema, with
  overrides. The craft mocks are decodable EVM and Solana transactions that must never be
  broadcast.

## Reading what a newer BFF adds

A status, an intent type or a network this version doesn't know keeps its intent readable, so one
new value never fails a whole page:

- an unknown status is kept, under a type that no known status matches;
- an unknown intent type is read as `{ type: "unknown", receivedType }`, so `switch (intent.type)`
  still narrows. A send or a swap that misses a field still fails;
- `network` and `asset.type` are open strings.

Profiles are read without the input limits of `AgentProfileInputSchema`, so a BFF that raises them
breaks no reader.

## Types shared with the SDK

The record, craft, receipt, stats and profile schemas are checked against the matching types of
`@ledgerhq/agent-intent-sdk` (`satisfies z.ZodType<…>`), so a field the SDK requires and the schema
lacks fails the typecheck. The status, error type and page size values and the profile name and
description limits come from the SDK too. Until the SDK release that holds them, all of these are a
copy in `src/internals/agentIntentSdk.ts`.
