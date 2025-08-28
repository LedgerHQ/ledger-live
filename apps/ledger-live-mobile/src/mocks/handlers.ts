import { http, HttpResponse } from "msw";
import { mockAssets } from "./dada/mockAssets";

const handlers = [
  http.get("https://dada.api.ledger-test.com/v1/assets", req => {
    // eslint-disable-next-line no-console
    console.log("\x1b[36m MSW: Dada request intercepted \x1b[0m", req);
    return HttpResponse.json(mockAssets);
  }),
];

export default handlers;
