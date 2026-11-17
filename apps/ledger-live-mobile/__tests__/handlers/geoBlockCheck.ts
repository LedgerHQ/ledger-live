import { HttpResponse } from "msw";

/** The OFAC geo-block check of `@domain/api-ofac`, on the Countervalues Service. */
export const GEO_BLOCK_CHECK_URL = "https://countervalues.live.ledger.com/v3/markets";

export const failedCheck = () => HttpResponse.text("", { status: 500 });
export const answeredCheck = () => HttpResponse.text("", { status: 200 });
export const blockedCheck = () => HttpResponse.text("", { status: 451 });

/** A check that answers with `respond` only once the test calls `answer`. */
export function heldCheck(respond: () => Response = failedCheck) {
  let resolveResponse!: (response: Response) => void;
  const response = new Promise<Response>(resolve => {
    resolveResponse = resolve;
  });
  return { respond: () => response, answer: () => resolveResponse(respond()) };
}
