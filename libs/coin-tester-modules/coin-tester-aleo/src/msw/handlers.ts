import { http, HttpResponse, type RequestHandler } from "msw";
import { ALEO_FAKE_NODE, ALEO_NETWORK_TYPE } from "../constants";
import { getAccountTransactionRows, transactionsAfterCursor } from "./indexer";
import { fetchAccountBalanceV2, fetchLatestBlockV2, fetchTransactionV2 } from "./node";
import { handleProve, type ExpectedTransfer, type ProveRequestBody } from "./prove";
import type { FakeScanner } from "./scanner";

const V2 = `${ALEO_FAKE_NODE}/v2/${ALEO_NETWORK_TYPE}`;
const SCANNER = `${ALEO_FAKE_NODE}/scanner/${ALEO_NETWORK_TYPE}`;

function toFailure(error: unknown): HttpResponse {
  const message = error instanceof Error ? error.message : String(error);
  // The bridge ignores broadcast_result, so only an HTTP error status makes it throw.
  return HttpResponse.json({ error: message }, { status: 500 });
}

/** Pass a getter when the expected transfer changes between the scenario's transactions. */
export function buildAleoHandlers(
  expected: ExpectedTransfer | (() => ExpectedTransfer),
): RequestHandler[] {
  const currentExpected = typeof expected === "function" ? expected : () => expected;

  return [
    http.get(`${V2}/blocks/latest`, async () => {
      try {
        return HttpResponse.json(await fetchLatestBlockV2());
      } catch (error) {
        return toFailure(error);
      }
    }),

    http.get(`${V2}/program/credits.aleo/mapping/account/:address`, async ({ params }) => {
      try {
        return HttpResponse.json(await fetchAccountBalanceV2(String(params.address)));
      } catch (error) {
        return toFailure(error);
      }
    }),

    http.get(`${V2}/transactions/address/:address`, async ({ params, request }) => {
      try {
        const address = String(params.address);
        return HttpResponse.json(
          transactionsAfterCursor(
            address,
            await getAccountTransactionRows(address),
            new URL(request.url).searchParams,
          ),
        );
      } catch (error) {
        return toFailure(error);
      }
    }),

    http.get(`${V2}/transactions/:id`, async ({ params }) => {
      try {
        return HttpResponse.json(await fetchTransactionV2(String(params.id)));
      } catch (error) {
        return toFailure(error);
      }
    }),

    http.get(`${V2}/tokens`, ({ request }) => {
      const params = new URL(request.url).searchParams;
      return HttpResponse.json({
        data: [],
        pagination: {
          limit: Number(params.get("limit") ?? 0),
          offset: Number(params.get("offset") ?? 0),
          total_count: 0,
          has_next: false,
          has_previous: false,
        },
      });
    }),

    http.post(`${ALEO_FAKE_NODE}/prove/${ALEO_NETWORK_TYPE}/prove`, async ({ request }) => {
      try {
        const body = (await request.json()) as ProveRequestBody;
        return HttpResponse.json(await handleProve(body, currentExpected()));
      } catch (error) {
        return toFailure(error);
      }
    }),
  ];
}

export function buildScannerHandlers(scanner: FakeScanner): RequestHandler[] {
  return [
    http.get(`${SCANNER}/pubkey`, () => HttpResponse.json(scanner.pubkey())),

    http.post(`${SCANNER}/register/encrypted`, async ({ request }) => {
      try {
        const body = (await request.json()) as { ciphertext: string; key_id: string };
        return HttpResponse.json(await scanner.register(body.ciphertext));
      } catch (error) {
        return toFailure(error);
      }
    }),

    http.post(`${SCANNER}/status`, async () => {
      try {
        return HttpResponse.json(await scanner.status());
      } catch (error) {
        return toFailure(error);
      }
    }),

    http.post(`${SCANNER}/records/owned`, async ({ request }) => {
      try {
        const body = (await request.json()) as { uuid: string; unspent?: boolean };
        return HttpResponse.json(await scanner.ownedRecords(body.uuid, { unspent: body.unspent }));
      } catch (error) {
        return toFailure(error);
      }
    }),
  ];
}
