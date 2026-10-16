import { PortfolioApiError } from "@ledgerhq/portfolio-module-framework";
import { decodeBase64Url, encodeBase64Url } from "./base64url";
import type { Side } from "./types";

/** Each side's own token: `null` once that side is exhausted, absent before its first page. */
export type Cursors = Partial<Record<Side, string | null>>;

export const encodeCursors = (cursors: Cursors): string => encodeBase64Url(JSON.stringify(cursors));

export function decodeCursors(token: string): Cursors {
  const cursors = parseToken(token);
  if (!isCursors(cursors)) throw new PortfolioApiError("BAD_REQUEST", `Invalid token ${token}`);
  return cursors;
}

function parseToken(token: string): unknown {
  try {
    return JSON.parse(decodeBase64Url(token));
  } catch {
    return undefined;
  }
}

const isCursor = (value: unknown): boolean =>
  value === undefined || value === null || typeof value === "string";

function isCursors(value: unknown): value is Cursors {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const { local, remote } = value as Record<string, unknown>;
  return isCursor(local) && isCursor(remote);
}
