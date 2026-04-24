export type Route = {
  method?: string;
  /** URL path pattern to match (string = substring, RegExp = test against pathname+search) */
  match: RegExp | string;
  response: unknown;
  status?: number;
  headers?: Record<string, string>;
};

export class MockServer {
  private _server: ReturnType<typeof Bun.serve> | null = null;
  private _port = 0;

  constructor(private readonly routes: Route[]) {}

  start(): void {
    const { routes } = this;
    const server = Bun.serve({
      port: 0,
      fetch(req) {
        const url = new URL(req.url);
        const pathAndQuery = url.pathname + url.search;

        for (const route of routes) {
          const matches =
            typeof route.match === "string"
              ? url.pathname.includes(route.match)
              : route.match.test(pathAndQuery);

          if (matches && (!route.method || route.method === req.method)) {
            return Response.json(route.response, {
              status: route.status ?? 200,
              headers: { "Content-Type": "application/json", ...(route.headers ?? {}) },
            });
          }
        }

        console.warn(`[mock-server] UNMATCHED: ${req.method} ${url.pathname}`);
        return new Response(`[mock-server] 404 Not Found: ${req.method} ${url.pathname}`, {
          status: 404,
        });
      },
    });
    this._server = server;
    this._port = server.port ?? 0;
  }

  stop(): void {
    this._server?.stop();
    this._server = null;
    this._port = 0;
  }

  get port(): number {
    if (!this._server) throw new Error("MockServer not started");
    return this._port;
  }
}
