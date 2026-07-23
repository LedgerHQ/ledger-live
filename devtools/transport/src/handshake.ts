/**
 * Base handshake protocol — the single source of truth shared by every client
 * (transport side) and the relay (server side).
 *
 * Identity is fixed and known at connect, so it travels in the connection URL's
 * query string (read from the HTTP upgrade request) rather than an in-band hello
 * frame. Clients build the URL with {@link identityUrl}; the relay reads it with
 * {@link parseIdentity}. Both use this one file so the param names never drift.
 */

export type Role = "host" | "tool";

/** Who a connection is, declared in its connect URL. */
export type Identity = {
  role: Role;
  id: string;
  /** A `tool` names the host it wants to talk to. A `host` omits it. */
  target?: string;
};

/** Encode an identity as a query string. */
export function identityToQuery(identity: Identity): string {
  const params = new URLSearchParams({ role: identity.role, id: identity.id });
  if (identity.target) params.set("target", identity.target);
  return params.toString();
}

/** Build a full connect URL with the identity baked into the query. */
export function identityUrl(baseUrl: string, identity: Identity): string {
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}${identityToQuery(identity)}`;
}

/**
 * Relay side: read the identity from the upgrade request URL (`req.url`, e.g.
 * `"/?role=tool&id=web-tools&target=app"`). Returns `undefined` if invalid.
 */
export function parseIdentity(reqUrl: string | undefined): Identity | undefined {
  if (!reqUrl) return undefined;
  const qs = reqUrl.includes("?") ? reqUrl.slice(reqUrl.indexOf("?") + 1) : "";
  const params = new URLSearchParams(qs);
  const role = params.get("role");
  const id = params.get("id");
  if ((role === "host" || role === "tool") && id) {
    return { role, id, target: params.get("target") ?? undefined };
  }
  return undefined;
}
