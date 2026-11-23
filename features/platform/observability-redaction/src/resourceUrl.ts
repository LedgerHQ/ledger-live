const REDACTED = "[redacted]";

const PATH_KEYS_BEFORE_AN_IDENTIFIER = new Set([
  "account",
  "accounts",
  "address",
  "addresses",
  "balances",
  "delegations",
  "delegators",
  "owner",
  "owners",
  "portfolio",
  "pubkey",
  "reverse",
  "reverse-resolve",
  "staking-deposits",
  "wallets",
]);

const ROUTES_AFTER_A_PATH_KEY = new Set([
  "active",
  "balance",
  "balances",
  "details",
  "ft",
  "stx",
  "utxos",
]);

const QUERY_KEY_NAMING_AN_IDENTIFIER =
  /account|address|delegator|holder|owner|principal|pubkey|pub_key|publickey|public_key|wallet/i;
const QUERY_KEY_DESCRIBING_AN_IDENTIFIER = /(?:currency|type)$/i;
const QUERY_KEY_HOLDING_A_CREDENTIAL = /^token$/i;

const MIN_ALPHANUMERIC_IDENTIFIER_LENGTH = 25;
const MIN_BASE64URL_IDENTIFIER_LENGTH = 40;
const NON_ALPHANUMERIC = /[^\dA-Za-z]+/;
const NON_BASE64URL = /[^\w-]+/;
const LIST_SEPARATOR = /,|%2c/i;
const ENCODED_COLON = /%3a/gi;
const ACCOUNT_ID_SEPARATOR = /:|%3a/i;
const DIGIT = /\d/;
const LETTER = /[A-Za-z]/;
const LOWERCASE = /[a-z]/;
const UPPERCASE = /[A-Z]/;
const ACCOUNT_ID_TYPE = /^[a-z]\w*$/i;
const ACCOUNT_ID_VERSION = /^\d+$/;
const ACCOUNT_ID_CURRENCY = /^[\w-]+$/;
const URL_SCHEME = /^[a-z][\d+.a-z-]*$/i;

const isAlphanumericIdentifier = (run: string): boolean =>
  run.length >= MIN_ALPHANUMERIC_IDENTIFIER_LENGTH && DIGIT.test(run) && LETTER.test(run);

const isBase64UrlIdentifier = (run: string): boolean =>
  run.length >= MIN_BASE64URL_IDENTIFIER_LENGTH &&
  DIGIT.test(run) &&
  LOWERCASE.test(run) &&
  UPPERCASE.test(run);

const isAccountId = (item: string): boolean => {
  const [type = "", version = "", currency = "", address = ""] = item
    .replaceAll(ENCODED_COLON, ":")
    .split(":");
  return (
    ACCOUNT_ID_TYPE.test(type) &&
    ACCOUNT_ID_VERSION.test(version) &&
    ACCOUNT_ID_CURRENCY.test(currency) &&
    address !== ""
  );
};

const holdsIdentifier = (value: string): boolean =>
  (ACCOUNT_ID_SEPARATOR.test(value) && value.split(LIST_SEPARATOR).some(isAccountId)) ||
  (value.length >= MIN_ALPHANUMERIC_IDENTIFIER_LENGTH &&
    value.split(NON_ALPHANUMERIC).some(isAlphanumericIdentifier)) ||
  (value.length >= MIN_BASE64URL_IDENTIFIER_LENGTH &&
    value.split(NON_BASE64URL).some(isBase64UrlIdentifier));

const scrubPath = (path: string): string => {
  const segments = path.split("/");
  return segments
    .map((segment, index) => {
      const followsIdentifierKey =
        index > 0 &&
        PATH_KEYS_BEFORE_AN_IDENTIFIER.has(segments[index - 1].toLowerCase()) &&
        !ROUTES_AFTER_A_PATH_KEY.has(segment.toLowerCase());
      const redacted = segment !== "" && (followsIdentifierKey || holdsIdentifier(segment));
      return redacted ? REDACTED : segment;
    })
    .join("/");
};

const scrubQueryParameter = (parameter: string): string => {
  const separator = parameter.indexOf("=");
  if (separator === -1) return holdsIdentifier(parameter) ? REDACTED : parameter;

  const key = parameter.slice(0, separator);
  const value = parameter.slice(separator + 1);
  const keyNamesAnIdentifier =
    QUERY_KEY_NAMING_AN_IDENTIFIER.test(key) && !QUERY_KEY_DESCRIBING_AN_IDENTIFIER.test(key);
  const redacted =
    value !== "" &&
    (keyNamesAnIdentifier || QUERY_KEY_HOLDING_A_CREDENTIAL.test(key) || holdsIdentifier(value));
  return redacted ? `${key}=${REDACTED}` : parameter;
};

const scrubQuery = (query: string): string => query.split("&").map(scrubQueryParameter).join("&");

const indexOrEnd = (index: number, end: number): number => (index === -1 ? end : index);

const originLength = (beforeQuery: string): number => {
  const schemeEnd = beforeQuery.indexOf("://");
  if (schemeEnd === -1 || !URL_SCHEME.test(beforeQuery.slice(0, schemeEnd))) return 0;
  return indexOrEnd(beforeQuery.indexOf("/", schemeEnd + 3), beforeQuery.length);
};

/**
 * Replaces each identifier of a URL with `[redacted]`:
 * - the path segment after a key such as `/address/` or `/accounts/`, unless it is a fixed route
 *   such as `/balances/stx`;
 * - the value of a parameter whose key names an identifier, such as `address`, `account.id` or
 *   `owner_address`, but not one that describes it, such as `walletType` or `walletCurrency`;
 * - the value of a `token` parameter, a credential;
 * - any segment or value holding an account id (`js:2:…`), an alphanumeric run of 25 characters or
 *   more mixing letters and digits, or a URL-safe base64 run of 40 characters or more.
 *
 * The origin and every other part of the URL are kept as they are.
 */
export function scrubResourceUrl(url: string): string {
  const fragmentStart = indexOrEnd(url.indexOf("#"), url.length);
  const queryStart = indexOrEnd(url.slice(0, fragmentStart).indexOf("?"), fragmentStart);
  const pathStart = originLength(url.slice(0, queryStart));

  const origin = url.slice(0, pathStart);
  const path = scrubPath(url.slice(pathStart, queryStart));
  const query =
    queryStart < fragmentStart ? `?${scrubQuery(url.slice(queryStart + 1, fragmentStart))}` : "";
  const fragment = fragmentStart < url.length ? `#${scrubPath(url.slice(fragmentStart + 1))}` : "";
  return `${origin}${path}${query}${fragment}`;
}

/** Whether `scrubResourceUrl` would change the URL. */
export function containsIdentifiers(url: string): boolean {
  return scrubResourceUrl(url) !== url;
}
