import { setupServer } from "msw/node";

const LOCAL_HOSTS = ["127.0.0.1", "localhost"];

/** Fails any request to a host that is not local: the tester talks to the sandbox only. Returns what stops it. */
export function forbidRemoteRequests(): () => void {
  const server = setupServer();
  server.listen({
    onUnhandledRequest: request => {
      const { hostname } = new URL(request.url);
      if (LOCAL_HOSTS.includes(hostname)) return;
      throw new Error(`Unhandled request: ${request.method} ${request.url}`);
    },
  });
  return () => server.close();
}
