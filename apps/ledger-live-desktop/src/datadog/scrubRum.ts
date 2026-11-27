import { scrubAccountId } from "~/renderer/helpers/scrubAccountId";

const REDACTED = "[redacted]";
const XPUB_JSON_VALUE = /"xpub"\s*:\s*"[^"]*"/g;
const DIGIT = /\d/;
const MIDDLE_ELLIPSIS = /[\dA-Za-z](?:\.{2,}|…)[\dA-Za-z]/;
const WHITESPACE_RUN = /(\s+)/;
const ADJACENT_REDACTIONS = /\[redacted\](?:\s+\[redacted\])+/g;

const ACCOUNT_ROUTE_SEGMENT = "account";

const withoutQuery = (urlPart: string): string => urlPart.split("?")[0];

function scrubRoute(route: string): string {
  const segments = route.split("/");
  const accountSegment = segments.indexOf(ACCOUNT_ROUTE_SEGMENT);
  const isAccountReference = (segment: string, index: number) =>
    accountSegment !== -1 && index > accountSegment && DIGIT.test(segment);
  return scrubAccountId(
    segments
      .map((segment, index) => (isAccountReference(segment, index) ? REDACTED : segment))
      .join("/"),
  );
}

export function scrubViewUrl(url: string): string {
  const routeStart = url.indexOf("#");
  if (routeStart === -1) return withoutQuery(url);
  const page = url.slice(0, routeStart);
  const route = url.slice(routeStart);
  return withoutQuery(page) + scrubRoute(withoutQuery(route));
}

export function scrubActionTargetName(name: string): string {
  return name.replace(XPUB_JSON_VALUE, `"xpub": "${REDACTED}"`);
}

const isIdentifyingWord = (word: string): boolean => DIGIT.test(word) || MIDDLE_ELLIPSIS.test(word);

export function scrubAutoActionName(name: string): string {
  return scrubActionTargetName(name)
    .split(WHITESPACE_RUN)
    .map(word => (isIdentifyingWord(word) ? REDACTED : word))
    .join("")
    .replace(ADJACENT_REDACTIONS, REDACTED);
}
