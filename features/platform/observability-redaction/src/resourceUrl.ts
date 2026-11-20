const REDACTED = "[redacted]";

const PATH_KEYS_BEFORE_AN_IDENTIFIER = new Set([
  "account",
  "accounts",
  "address",
  "addresses",
  "balances",
  "delegations",
  "delegators",
  "portfolio",
  "reverse",
  "reverse-resolve",
  "staking-deposits",
]);

const QUERY_KEYS_HOLDING_AN_IDENTIFIER = new Set([
  "account",
  "accounts",
  "address",
  "addresses",
  "owner",
  "wallet",
]);

const MIN_IDENTIFIER_LENGTH = 25;
const NON_ALPHANUMERIC = /[^\dA-Za-z]+/;
const DIGIT = /\d/;
const LETTER = /[A-Za-z]/;
const LEGACY_ACCOUNT_ID = /[a-z][\d_a-z]*(?::|%3a)\d+(?::|%3a)[\d_a-z-]+(?::|%3a)/i;
const URL_PARTS = /^([a-z][\d+.a-z-]*:\/\/[^#/?]*)?([^#?]*)(\?[^#]*)?(#[\s\S]*)?$/i;

const isIdentifier = (token: string): boolean =>
  token.length >= MIN_IDENTIFIER_LENGTH && DIGIT.test(token) && LETTER.test(token);

const holdsIdentifier = (value: string): boolean =>
  LEGACY_ACCOUNT_ID.test(value) || value.split(NON_ALPHANUMERIC).some(isIdentifier);

const scrubPath = (path: string): string => {
  const segments = path.split("/");
  return segments
    .map((segment, index) => {
      const followsIdentifierKey =
        index > 0 && PATH_KEYS_BEFORE_AN_IDENTIFIER.has(segments[index - 1].toLowerCase());
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
  const redacted =
    value !== "" &&
    (QUERY_KEYS_HOLDING_AN_IDENTIFIER.has(key.toLowerCase()) || holdsIdentifier(value));
  return redacted ? `${key}=${REDACTED}` : parameter;
};

const scrubQuery = (query: string): string => query.split("&").map(scrubQueryParameter).join("&");

/**
 * Replaces each identifier of a URL with `[redacted]`: the path segment after a key such as
 * `/address/` or `/accounts/`, the value of a parameter such as `address=`, and any segment or value
 * holding an account id (`js:2:bitcoin:…`) or an alphanumeric run of 25 characters or more that
 * mixes letters and digits. The origin and every other part of the URL are kept as they are.
 */
export function scrubResourceUrl(url: string): string {
  const [, origin = "", path = "", query = "", fragment = ""] = URL_PARTS.exec(url) ?? [];
  const scrubbedQuery = query && `?${scrubQuery(query.slice(1))}`;
  const scrubbedFragment = fragment && `#${scrubPath(fragment.slice(1))}`;
  return `${origin}${scrubPath(path)}${scrubbedQuery}${scrubbedFragment}`;
}

/** Whether `scrubResourceUrl` would change the URL. */
export function containsIdentifiers(url: string): boolean {
  return scrubResourceUrl(url) !== url;
}
