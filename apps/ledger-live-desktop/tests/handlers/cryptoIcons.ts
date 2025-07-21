/* eslint-disable @typescript-eslint/no-unused-vars */
import { http, HttpResponse } from "msw";
import jsonResponse from "./fixtures/cryptoIcons/list.json";

const handlers = [
  http.get("https://crypto-icons.ledger.com/index.json", () => {
    return HttpResponse.json(jsonResponse);
  }),
];

export default handlers;
