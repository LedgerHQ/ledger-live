import type { WalletAPIServer, WalletHandlers } from "@ledgerhq/wallet-api-server";

/** The account data cannot serve this request as asked: the host's legacy handler answers it instead. */
export class NotServedByAccountDataError extends Error {
  override name = "NotServedByAccountDataError";
}

export type WalletHandlerName = keyof WalletHandlers;
type AnyHandler = (params: unknown) => unknown;

/** The handlers of one server: the account data ones first, the host's legacy ones as fallback. */
export type HandlerRoutes = {
  own: Partial<WalletHandlers>;
  legacy: Partial<WalletHandlers>;
  registered: Set<WalletHandlerName>;
};

export const createHandlerRoutes = (): HandlerRoutes => ({
  own: {},
  legacy: {},
  registered: new Set(),
});

const asAny = (handler: WalletHandlers[WalletHandlerName] | undefined): AnyHandler | undefined =>
  handler as AnyHandler | undefined;

async function dispatchRoute(routes: HandlerRoutes, method: WalletHandlerName, params: unknown) {
  const own = asAny(routes.own[method]);
  const legacy = asAny(routes.legacy[method]);
  if (own) {
    try {
      return await own(params);
    } catch (error) {
      if (!(error instanceof NotServedByAccountDataError) || !legacy) throw error;
    }
  }
  if (!legacy) throw new Error(`No handler for ${method}`);
  return legacy(params);
}

/** Registers `method` once per server; which handler answers is read at each request. */
export function ensureRoute(
  server: WalletAPIServer,
  routes: HandlerRoutes,
  method: WalletHandlerName,
): void {
  if (routes.registered.has(method)) return;
  routes.registered.add(method);
  const route = (params: unknown) => dispatchRoute(routes, method, params);
  server.setHandler(method, route as WalletHandlers[typeof method]);
}
