import type { Request, Route } from "@playwright/test";
import { PageHolder } from "tests/page/abstractClasses";

export async function overrideNetworkPayload(
  pageHolder: PageHolder,
  url: string,
  updatePayload: (json: any) => any,
) {
  await pageHolder.getPage().route(url, async route => {
    const response = await route.fetch();
    const payload = await response.json();
    const newPayload = updatePayload(payload);
    await route.fulfill({ response, json: newPayload });
  });
}

type FulfillOptions = NonNullable<Parameters<Route["fulfill"]>[0]>;

export type FulfillNetworkRouteOptions = {
  url: string | RegExp | ((url: URL) => boolean);
  /** Called for each request, so the answer can depend on its body or on the state of the test. */
  respond: (request: Request) => FulfillOptions | Promise<FulfillOptions>;
};

/**
 * Answers the requests matching `url` without reaching the network. The app page has its own
 * origin, so each answer allows any origin; Playwright answers the CORS preflight of an
 * intercepted request itself.
 */
export async function fulfillNetworkRoute(
  pageHolder: PageHolder,
  options: FulfillNetworkRouteOptions,
) {
  const { url, respond } = options;
  await pageHolder.getPage().route(url, async route => {
    const response = await respond(route.request());
    await route.fulfill({
      ...response,
      headers: { "Access-Control-Allow-Origin": "*", ...response.headers },
    });
  });
}
