---
"@shared/env": patch
"@shared/api-services": patch
"@domain/api-aggregated-assets": patch
---

Migrate the DADA (Dynamic Assets Data Aggregator) integration from `dada.api.ledger.com` / `dada.api.ledger-test.com` to the new Gravitee API gateway (`gravitee-internal-gateway.ldg-stg-apim.aws.stg.ldg-tech.com/dada`), and send the required `x-gravitee-api-key` header (sourced from `DADA_GRAVITEE_API_KEY`) on every DADA request.
