# Future direction

The functions here — `getCryptoCurrencyById`, `findCryptoCurrencyById`, `hasCryptoCurrencyId` —
are **static accessors**: they read from `CRYPTO_CURRENCIES_REGISTRY`, the canonical compile-time
crypto-currency registry.

They live under `legacy/` because the static registry is a transitional shape, not the end state.
Today the crypto-currency list is embedded in code, so a coin rename needs an app release. The
intended end state is a **dynamic slice**: currencies served from the backend, hydrated into an
RTK slice with a persisted cache and a release-time static fallback — the same pattern tokens
already use.

When that lands, these accessors become true **selectors** over that slice:

- the signatures stay identical (`getCryptoCurrencyById(id)`, …), so call sites do not change;
- only the implementation changes — reading the slice instead of the static constant;
- the static registry survives as the synchronous fallback (e.g. add-account search, startup
  rehydration), so ids always resolve.

This file is therefore the **stable seam**: an accessor today, a selector tomorrow, with no change
required at the call site.
