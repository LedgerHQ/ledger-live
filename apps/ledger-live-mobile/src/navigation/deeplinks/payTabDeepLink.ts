/**
 * The path the Pay tab answers on. `DeeplinksProvider` maps it onto `ScreenName.PayTab`, so this is
 * the one place that spells it.
 */
export const PAY_TAB_DEEP_LINK_PATH = "paytab";

/**
 * The Pay tab deep link. `go.ledger.com/ledger/card-baanx` redirects the Card login here, and the
 * secure browser ends its session on it: `ASWebAuthenticationSession` takes the scheme as its
 * `callbackURLScheme`, and the Android polyfill matches the incoming link against the whole value.
 *
 * It must agree with what `go.ledger.com` redirects to. That target is configured outside this repo,
 * so a change there needs a change here. A mismatch does not break the login — the deep link still
 * carries the code — but nothing closes the browser, and it stays on top of the Pay tab.
 */
export const PAY_TAB_DEEP_LINK = `ledgerlive://${PAY_TAB_DEEP_LINK_PATH}`;
