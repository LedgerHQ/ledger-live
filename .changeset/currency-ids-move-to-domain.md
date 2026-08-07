---
"@domain/entity-currency-crypto": minor
"@domain/entity-currency-token": minor
"@domain/entity-currency-fiat": minor
"@shared/schema-primitives": minor
"@domain/entity-contact": minor
---

Move the currency id schemas to the packages that own them.

`CryptoCurrencyIdSchema`, `TokenCurrencyIdSchema` and `FiatCurrencyIdSchema` (and their inferred
types) now live in `@domain/entity-currency-crypto`, `@domain/entity-currency-token` and
`@domain/entity-currency-fiat` respectively, instead of `@shared/schema-primitives`. A primitives
package has no business knowing about crypto, tokens or fiat.

The crypto and token packages used to re-export these symbols from primitives, which made them
proxies: two import paths for the same thing, and no obvious original provider. Consumers already
importing from `@domain/entity-currency-*` are unaffected, since the symbols genuinely moved there.
Anything importing them from `@shared/schema-primitives` must now import the owning domain package.
