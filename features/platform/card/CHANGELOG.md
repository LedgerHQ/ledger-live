# @features/platform-card

## 0.3.1-next.0

### Patch Changes

- Updated dependencies [[`6918e5b`](https://github.com/LedgerHQ/ledger-live/commit/6918e5b285afe016d54f95090d44db3c1467fcec), [`e8c2316`](https://github.com/LedgerHQ/ledger-live/commit/e8c23168916415e569b27b530c71785e0dd2f29e), [`9f130fb`](https://github.com/LedgerHQ/ledger-live/commit/9f130fb908ad4596ef5697189633a3470935de75)]:
  - @domain/api-card-management@0.4.0-next.0

## 0.3.0

### Minor Changes

- [#20809](https://github.com/LedgerHQ/ledger-live/pull/20809) [`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Pay Card session in OS secure storage (LIVE-34742)

  `cardSession` now stores the whole session — both tokens and both lifetimes — through
  `react-native-keychain` on native, and through renderer memory on web and desktop. The app already
  uses that library for the app password, so the session needs no second secure-storage package.

  Each key is a keychain `service` of its own, and the access token sits alone in one of them, so the
  base query reads one small value per request. `AFTER_FIRST_UNLOCK` on iOS and `AES_GCM_NO_AUTH` on
  Android state the same rule: no prompt, and a value a background launch can read, but nothing before
  the first unlock after boot.

  `cardSession.get` reads all three keys, so it waits its turn behind a write. A login over a live
  session replaces the two cold keys before the access token, and a read between the two would report
  the previous access token with the new refresh token.

- [#20808](https://github.com/LedgerHQ/ledger-live/pull/20808) [`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read the Pay Card session token asynchronously (LIVE-34742)

  `cardApiExtra.getCardSessionToken` now returns a promise, and the Card base query awaits it. The
  session is about to live in OS secure storage, which only reads asynchronously. Behaviour does not
  change yet: the accessor still answers from memory.

  An await can reject, and `BaseQueryFn` must always answer with a result. A session port that rejects
  now gives a `CUSTOM_ERROR` result, so every caller still reads an `error.status`.

- [#20983](https://github.com/LedgerHQ/ledger-live/pull/20983) [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the Baanx authorize page directly, and drop the CSRF state (LIVE-36301)

  The login no longer asks the backend where to send the user. It builds the authorize URL itself and
  opens the secure browser on it, and the provider hosts the page and owns the redirect. That removes a
  network call, a machine state and one way a login could fail.

  ```
  GET {CARD_API_URL}/v1/auth/oauth2/authorize
    ?client_id=…&response_type=code
    &scope=openid profile email offline_access
    &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
  ```

  The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
  with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
  code against this attempt's challenge, so no other attempt can exchange it. Both token grants move to
  `/v1/auth/oauth2/token`, and neither repeats `redirect_uri` there: Baanx's contract for that endpoint
  takes only `grant_type`, `code`, and `code_verifier`.

  `oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.

  `prepareAttempt` builds the authorize URL, rather than the transition that follows it. The URL builder
  throws on a misconfigured `apiUrl`, and a throw inside an action stops the machine instead of reaching
  a transition. From the actor it lands on `onError`, which wipes the stored attempt and reports a
  failure the user can retry.

  A live exchange against Baanx's UAT environment answered with no `refresh_token_expires_in`, which
  `PayCardSessionResponseSchema` required. That field is gone from the schema, the session, and the
  stored lifetimes: Baanx's contract carries no lifetime for the refresh token, only for the access
  token, so nothing here can track one.

### Patch Changes

- Updated dependencies [[`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`0ad6182`](https://github.com/LedgerHQ/ledger-live/commit/0ad6182ac7fa955c01a8fd679182f7fe3b83cace), [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891)]:
  - @domain/api-card-management@0.3.0

## 0.3.0-next.0

### Minor Changes

- [#20809](https://github.com/LedgerHQ/ledger-live/pull/20809) [`e732d3e`](https://github.com/LedgerHQ/ledger-live/commit/e732d3e258c653fc83e1474434f3bb02c136ae62) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Keep the Pay Card session in OS secure storage (LIVE-34742)

  `cardSession` now stores the whole session — both tokens and both lifetimes — through
  `react-native-keychain` on native, and through renderer memory on web and desktop. The app already
  uses that library for the app password, so the session needs no second secure-storage package.

  Each key is a keychain `service` of its own, and the access token sits alone in one of them, so the
  base query reads one small value per request. `AFTER_FIRST_UNLOCK` on iOS and `AES_GCM_NO_AUTH` on
  Android state the same rule: no prompt, and a value a background launch can read, but nothing before
  the first unlock after boot.

  `cardSession.get` reads all three keys, so it waits its turn behind a write. A login over a live
  session replaces the two cold keys before the access token, and a read between the two would report
  the previous access token with the new refresh token.

- [#20808](https://github.com/LedgerHQ/ledger-live/pull/20808) [`f64ceec`](https://github.com/LedgerHQ/ledger-live/commit/f64ceecbdaccec2c56ace4cc459d670db5920b68) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Read the Pay Card session token asynchronously (LIVE-34742)

  `cardApiExtra.getCardSessionToken` now returns a promise, and the Card base query awaits it. The
  session is about to live in OS secure storage, which only reads asynchronously. Behaviour does not
  change yet: the accessor still answers from memory.

  An await can reject, and `BaseQueryFn` must always answer with a result. A session port that rejects
  now gives a `CUSTOM_ERROR` result, so every caller still reads an `error.status`.

- [#20983](https://github.com/LedgerHQ/ledger-live/pull/20983) [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891) Thanks [@liviuciulinaru](https://github.com/liviuciulinaru)! - Open the Baanx authorize page directly, and drop the CSRF state (LIVE-36301)

  The login no longer asks the backend where to send the user. It builds the authorize URL itself and
  opens the secure browser on it, and the provider hosts the page and owns the redirect. That removes a
  network call, a machine state and one way a login could fail.

  ```
  GET {CARD_API_URL}/v1/auth/oauth2/authorize
    ?client_id=…&response_type=code
    &scope=openid profile email offline_access
    &redirect_uri=…&code_challenge=…&code_challenge_method=S256&prompt=consent
  ```

  The attempt is now a PKCE pair alone. The redirect carries `code`, and the `state` that used to travel
  with it is gone, because PKCE already ties the code to the verifier on disk: the provider issues the
  code against this attempt's challenge, so no other attempt can exchange it. Both token grants move to
  `/v1/auth/oauth2/token`, and neither repeats `redirect_uri` there: Baanx's contract for that endpoint
  takes only `grant_type`, `code`, and `code_verifier`.

  `oauthConfig` gains `apiUrl`, which is the host the authorize page lives on.

  `prepareAttempt` builds the authorize URL, rather than the transition that follows it. The URL builder
  throws on a misconfigured `apiUrl`, and a throw inside an action stops the machine instead of reaching
  a transition. From the actor it lands on `onError`, which wipes the stored attempt and reports a
  failure the user can retry.

  A live exchange against Baanx's UAT environment answered with no `refresh_token_expires_in`, which
  `PayCardSessionResponseSchema` required. That field is gone from the schema, the session, and the
  stored lifetimes: Baanx's contract carries no lifetime for the refresh token, only for the access
  token, so nothing here can track one.

### Patch Changes

- Updated dependencies [[`d5ea888`](https://github.com/LedgerHQ/ledger-live/commit/d5ea888d3a154feeb29b452841749d358629b8c1), [`0ad6182`](https://github.com/LedgerHQ/ledger-live/commit/0ad6182ac7fa955c01a8fd679182f7fe3b83cace), [`eba4d17`](https://github.com/LedgerHQ/ledger-live/commit/eba4d175ad10f1431a222a4fa98481ea4285e891)]:
  - @domain/api-card-management@0.3.0-next.0

## 0.2.0

### Minor Changes

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).

## 0.2.0-next.0

### Minor Changes

- [#20702](https://github.com/LedgerHQ/ledger-live/pull/20702) [`e07e0ba`](https://github.com/LedgerHQ/ledger-live/commit/e07e0baca2e4edfe90163367047459257034f7cc) Thanks [@mcayuelas-ledger](https://github.com/mcayuelas-ledger)! - Scaffold the Card API on a single endpoint-less `cardApi` service (DDD, CMC/DADA pattern): add the `services/card` transport in `@shared/api-services` with Bearer + `x-client-key` (`CARD_BAANX_CLIENT_KEY`) + one 401-refresh, the `@domain/api-card-management` endpoint injector, the `@features/platform-card` in-memory session and `getCardSessionToken`/`refreshCardSession` accessors, the `CARD_API_URL` / `CARD_BAANX_CLIENT_KEY` envs, and register `cardApi` in both apps. The legacy `payCardApi` Card Auth holdout is left untouched pending its migration onto `cardApi` (LIVE-33829).
