import { http, HttpResponse } from "msw";
import { getEnv } from "@shared/env";

const handlers = [
  http.get(`${getEnv("CAL_SERVICE_URL")}/v1/tokens`, () => HttpResponse.json([])),
  http.get(`${getEnv("CAL_SERVICE_URL")}/v1/currencies`, () => HttpResponse.json([])),
];

export default handlers;
