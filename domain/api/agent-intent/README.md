# @domain/api-agent-intent

> [!CAUTION]
> **Status: UNSTABLE**. New package, in active development.

The Agent Intent BFF endpoints Ledger Wallet calls to review an agent's intents, injected into
`agentIntentApi` from `@shared/api-services`. Values are validated with the schemas of
`@domain/entity-agent-intent`.

| Hook | Request |
| --- | --- |
| `useGetAgentIntentsInfiniteQuery` | `GET v1/intents`, page by page |
| `useGetAgentIntentQuery` | `GET v1/intents/{id}` |
| `useGetAgentIntentStatsQuery` | `GET v1/intents/stats` |
| `useCraftAgentIntentMutation` | `POST v1/intents/{id}/craft`, send intents only |
| `useSubmitAgentIntentSignatureMutation` | `POST v1/intents/{id}/signature` |
| `useRejectAgentIntentMutation` | `POST v1/intents/{id}/reject` |
| `useGetAgentProfilesQuery` | `GET v1/agent-profiles` |
| `useGetAgentProfileQuery` | `GET v1/agent-profiles/{agentPubkey}` |
| `useCreateAgentProfileMutation`, `useUpdateAgentProfileMutation`, `useDeleteAgentProfileMutation` | `POST`, `PATCH`, `DELETE v1/agent-profiles/{agentPubkey}` |

A swap intent needs craft parameters that `craftAgentIntent` doesn't send: swaps are out of this
release, and the BFF answers 400 `invalid_craft_parameters`.

## Lists and counts

The intent list reads one page per request: the first carries the filters, each next page only the
cursor the BFF sent in `X-Ledger-Next`.

Each intent and each profile is parsed on its own. One that fails its schema is left out of the
list and reported in `unreadable` with its id and issues, so a single malformed record doesn't
hide the others.

The counts are all-time: `approved` counts every intent the user signed, and pending and expired
intents count in `total` only.

Pass `AGENT_INTENT_REFRESH_INTERVAL_MS` as `pollingInterval` to the counts and to the pending list,
which is one page in practice. Don't poll a long history: an infinite query refetches every page
it has loaded.

## Failures

`readAgentIntentFailure(error)` tells a caller what happened:

- `http`: the BFF's status, message and error type (`stale_revision`, `not_a_member`, …);
- `unreadable-response`: a 2xx whose body failed its schema, so the BFF acted on the request;
- `invalid-request`: the argument failed its schema and nothing was sent;
- `network`, `unknown`.

After submitting a signature, any failure other than `http` can mean the BFF holds it: read the
intent again before asking the user to sign again.

`getAgentProfile` gives `null` when the agent has no profile. A 404 from a gateway stays an error.

## Store

The app registers `agentIntentApi` with `agentIntentService`, and a `createAuthMiddleware` whose
`key` is `AGENT_INTENT_AUTH_PROVIDER_KEY` (realm `agent-intent-customers`). Without that
middleware, requests go out without a token.

## Tests

`@domain/api-agent-intent/mock/agent-intent-api` has the BFF URLs, `listenToAgentIntentApi()`,
default handlers, `agentIntentErrorResponse()` in the BFF's error shape, the store's extra
argument and a test auth middleware.
