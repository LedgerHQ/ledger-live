import { PortfolioApiError } from "./errors";
import type { PageView } from "./types";

/** A page of `items` from an offset token, the way the local module paginates. */
export function pageOf<T>(items: T[], query: { size?: number; token?: string } = {}): PageView<T> {
  const start = query.token ? Number(query.token) : 0;
  if (!Number.isInteger(start) || start < 0) {
    throw new PortfolioApiError("BAD_REQUEST", `Invalid token ${query.token}`);
  }
  const end = query.size === undefined ? items.length : start + query.size;
  const page = items.slice(start, end);
  return end < items.length ? { items: page, nextToken: String(end) } : { items: page };
}
