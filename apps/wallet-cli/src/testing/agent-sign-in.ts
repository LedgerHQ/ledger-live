import type { FakeAgentIntentService } from "./agent-intent-service";
import { KEYCLOAK_TOKEN } from "./auth-routes";
import type { Route } from "./mock-server";

const KEYCLOAK_AUTH = "/protocol/openid-connect/auth";

/**
 * The routes of `service`, its sign-in observed: records the Keycloak path each sign-in starts at,
 * and while `refused` is set, refuses the final token exchange, as Keycloak does for an agent key
 * that is not a member of the Trustchain.
 */
export class AgentSignIn {
  readonly keycloakPaths: string[] = [];
  refused = false;
  readonly routes: Route[];

  constructor(service: FakeAgentIntentService) {
    const exchange: Route = {
      method: "POST",
      match: "/openid/v1/exchange",
      response: { access_token: KEYCLOAK_TOKEN, token_type: "Bearer" },
      onRequest: () =>
        this.refused ? Response.json({ error: "not a member" }, { status: 403 }) : undefined,
    };
    this.routes = [
      exchange,
      ...service.routes.map(route =>
        String(route.match).includes(KEYCLOAK_AUTH.replaceAll("/", String.raw`\/`))
          ? {
              ...route,
              onRequest: (request: Request) => {
                this.keycloakPaths.push(new URL(request.url).pathname);
                return route.onRequest?.(request);
              },
            }
          : route,
      ),
    ];
  }

  reset(): void {
    this.keycloakPaths.length = 0;
    this.refused = false;
  }
}
