import { http, HttpResponse } from "msw";
import { getEnv } from "@shared/env";

/**
 * A default answer for CAL, so no test reaches the real service: `onUnhandledRequest` is `bypass`,
 * which would otherwise let a CAL query out to the network. A test that needs tokens overrides this
 * with `server.use`.
 */
export default [
  http.get(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`, () => HttpResponse.json([])),
  http.get(`${getEnv("CAL_SERVICE_URL")}/v1/currencies`, () => HttpResponse.json([])),
];
