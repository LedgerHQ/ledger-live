# @domain/entity-pay-card

Domain entity package for the Ledger Pay Card flow's Redux state.

- `schema.ts` — canonical schema for the params the Pay Card flow is opened with.
- `types.ts` — inferred params and slice types.
- `slice.ts` — Redux slice for opening and closing the Pay Card flow.
- `selectors.ts` — selectors over that slice.

Both apps register `payCardSlice` in their root reducer, which is why this state lives here rather
than in a flow package.

Everything about talking to the Card API lives elsewhere: the wire schemas and endpoints belong to
the flow that calls them, in `@features/flow-pay-card-auth`, and reaching the backend belongs to
`services/pay-card` in `@shared/api-services`.
