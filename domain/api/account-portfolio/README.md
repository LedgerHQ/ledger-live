# @domain/api-account-portfolio

> [!CAUTION]
> **Status: UNSTABLE** — The Portfolio service contract is still moving; API may change.

Endpoints for the Portfolio service, injected into `portfolioApi` from `@shared/api-services`.

There is no `@domain/entity-portfolio`. Nothing stores this data yet, so the response schemas in this package are the service contract. Add the entity package when a feature owns the data, and depend on it from here.

## Registrations

`registrationOf(descriptor)` turns an `AccountDescriptor` into the registration the service accepts, or `undefined` when no family strategy covers it (Bitcoin by xpub, EVM by address for now). Add a family by adding a strategy to `PORTFOLIO_REGISTRATION_STRATEGIES`.

`planRegistrations(existing, wanted)` tells which registrations to add and which to remove so that a portfolio registers exactly the wanted accounts.

## Composite endpoints

- `syncPortfolio` creates the portfolio if missing, then adds and removes registrations to match the ones given.
- `getBalanceSnapshot` reads every balance page for a currency. It fails with a `CUSTOM_ERROR` rather than return a partial balance when the service paginates beyond `MAX_BALANCE_PAGES`.
