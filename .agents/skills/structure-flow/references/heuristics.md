# Placement heuristics

Detail for [structure-flow](../SKILL.md). No linter decides these rules: they are checked in review.

## Entity or flow state

Ownership decides: entity state is business data that exists without any journey, flow state is
what one journey decides about its own UI. The columns are hints toward that answer, not a vote: a PM
may name the draft address or the current step, and both stay flow state.

| Hints of entity state, in `domain/entity`     | Hints of flow state, in the flow's `state/`                  |
| --------------------------------------------- | ------------------------------------------------------------ |
| A backend could return it                     | It describes what the UI is doing now                        |
| Two or more features speak of it              | Its name says `open`, `step`, `selected`, `draft`, `filter`  |
| It carries its own business rules             | Only the journey decides its value                           |
| It still means something with no UI           | Its meaning ends with the journey, even if the app persists it |

The app may register a flow slice in its store or persist it (a list filter): the state stays the
flow's and its layer does not change.

Examples on `develop`:

- A contact and its addresses are entity state: `@domain/entity-contact` holds the schema, the slice
  and the selectors that every contacts flow reads.
- The step of the add-address journey and the address being typed are flow state:
  `state/addAddressFlowReducer.ts` in `@features/flow-contacts-add-address`.

The entity survives without any UI: delete every flow and it still makes sense. A flow slice holds
only what the flow decides, never a copy of entity data; it reads entities through their selectors.
How a flow registers or keeps its state: [flow-package](../../flow-package/SKILL.md#flow-state-versus-entity-state).

## One flow, one journey

One flow is one use case, with one entry and one exit, so one package and one owner. A flow that grows
several journeys becomes a god-flow: every change touches every team and nothing can be flagged alone.

Split at the journey lines when any of these holds:

- The part has its own Figma file.
- The part is demoed on its own at a sprint review.
- The part is tested behind its own feature flag.
- The kebab name of the package needs an "and" (`add-and-edit-address`).

A "screen" that has its own entry point, reachable from several places, is a flow in disguise: give it
its own package.

Example: contacts. Each journey is its own package (`@features/flow-contacts-list`,
`@features/flow-contacts-detail`, `@features/flow-contacts-add-contact`,
`@features/flow-contacts-add-address`, `@features/flow-contacts-introduction` and the edit and delete
flows), and `@features/flow-contacts` is the thin orchestrator that composes the list, detail,
add-contact and introduction flows into one entry. What several of those
flows need (contact avatars, the confirmation dialog, address book hooks, device intents) sank to
`@features/platform-contacts`. Never add a `common/` or `shared/` folder or package inside a family of
flows: shared pieces go to `features/platform`, generic ones to `shared/`.

## Each package owns its view

When two packages need similar data, each one declares the shape it needs and maps it explicitly from
the entity. They do not import each other's types, and they do not widen the entity to fit a view.
Accidental similarity is not intentional coupling: two shapes that look alike today change for
different reasons tomorrow. The entity is the only vocabulary packages share.

Example: `@features/flow-pay-balance` declares its own `Stablecoin` in `types.ts`, with only the
`currency` fields it renders (`id`, `ticker`) plus `value` and `balance`, and takes them through its
`PortfolioPort`. It does not reuse a currency or portfolio type from another feature, and its
`logic/` maps from that shape only.

Apply it to ports too: a port lists the calls its package makes, nothing more, so the app implements a
small interface per package instead of one wide service.
