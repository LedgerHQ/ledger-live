# @domain/api-account-portfolio

Endpoints for the Portfolio service, injected into `portfolioApi` from `@shared/api-services`.

There is no `@domain/entity-portfolio`. Nothing stores this data yet, so the response schemas in this package are the service contract. Add the entity package when a feature owns the data, and depend on it from here.
