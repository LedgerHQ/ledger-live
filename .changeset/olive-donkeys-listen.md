---
"live-mobile": patch
"@devtools/pay-card": minor
"@devtools/bindings": minor
"@features/flow-pay-card-auth": minor
---

Add Card session controls to the Card / Pay DevTool

The panel gains an "Auth session", a "Device secure storage", a "Send API requests" and an "MSW Auth
Renewal Mock" section: the stored tokens, and buttons that call the real session accessors to break a
token, renew or fetch. An MSW handler decides what the Baanx renewal grant answers, and
publishes its counters to the panel.

The mock offers one button per documented response of `POST /v1/auth/oauth2/token`, named by status
code — 200, 400, 422, 498, 499, 500 — plus a slow 200, a 200 the wire schema rejects, and a transport
failure. Each carries the body the Baanx reference documents for it, so a tester matches the panel
against the API docs rather than against a nickname.

The panel follows the renewal contract: it sends the epoch of the session it read, and names a
`session-replaced` answer when a login or a logout got in first.

"Auth session" tells a store it could not read apart from an empty one. The native store rejects a
read the OS refused, so a locked keychain shows "Unreadable" with the reason rather than reporting
the tester as signed out.

A "Secure browser" section closes the panel on mobile. It takes a URL and opens it in the secure
browser the hosted login uses, so a tester reaches an authorize page, or a redirect, without the
login flow that builds the URL. The mobile host passes the Pay tab deep link, which is what ends
such a session, and the panel prints the redirect the session answered.

The panel works without MSW, so it runs on a device. The handler stays behind `MSW_ENABLED`.

The mock reports one counter, `renewals`, and counts only the renewals it answered. On React Native
MSW installs two interceptors, one on `fetch` and one on the `XMLHttpRequest` that React Native's
`fetch` is built on, so a handler runs twice for every request it passes through. A "user requests"
counter therefore reported two for one, and it is removed: the `[card api]` trace in
`@shared/api-services` runs in the client and prints one line per request.
