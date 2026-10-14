import { toPortfolioApiError } from "./errors";
import type { PortfolioServiceClientConfig } from "./types";

type Method = "GET" | "PUT" | "POST" | "DELETE";

type Query = Record<string, string | number | undefined>;

type RequestOptions = { query?: Query; body?: unknown };

export type HttpRequest = <T>(method: Method, path: string, options?: RequestOptions) => Promise<T>;

/** A path whose interpolated segments are URL-encoded. */
export const route = (strings: TemplateStringsArray, ...segments: string[]): string =>
  String.raw({ raw: strings }, ...segments.map(segment => encodeURIComponent(segment)));

function toSearch(query: Query = {}): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.append(key, String(value));
  }
  const search = params.toString();
  return search === "" ? "" : `?${search}`;
}

export function createRequest(config: PortfolioServiceClientConfig): HttpRequest {
  const baseUrl = config.baseUrl.endsWith("/") ? config.baseUrl.slice(0, -1) : config.baseUrl;
  const send = config.fetch ?? ((url: string, init: RequestInit) => globalThis.fetch(url, init));
  const configuredHeaders = async () =>
    typeof config.headers === "function" ? config.headers() : config.headers;

  return async (method, path, { query, body } = {}) => {
    const hasBody = body !== undefined;
    const headers = new Headers(await configuredHeaders());
    headers.set("accept", "application/json");
    if (hasBody) headers.set("content-type", "application/json");

    const response = await send(`${baseUrl}${path}${toSearch(query)}`, {
      method,
      headers,
      ...(hasBody && { body: JSON.stringify(body) }),
    });
    if (!response.ok) throw await toPortfolioApiError(response);
    return response.json();
  };
}
