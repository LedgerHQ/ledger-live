import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { http, HttpResponse } from "msw";
import {
  FEE_ESTIMATE,
  RECIPIENT,
  SENDER,
  TEST_KASPA_ENDPOINT,
  makeApiUtxo,
  server,
} from "../../test/msw.mock";
import { estimateFees } from "./estimateFees";

const UTXOS_URL = `${TEST_KASPA_ENDPOINT}/addresses/utxos`;
const FEE_URL = `${TEST_KASPA_ENDPOINT}/info/fee-estimate`;
const BLOCKDAG_URL = `${TEST_KASPA_ENDPOINT}/info/blockdag`;
const DAG_INFO = { virtualDaaScore: "2000000" };

const intent: TransactionIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 150_000_000n,
  asset: { type: "native" },
};

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("estimateFees via MSW", () => {
  it("returns a positive mass-based fee by crafting the intent over the real HTTP path", async () => {
    server.use(
      http.post(UTXOS_URL, () => HttpResponse.json([makeApiUtxo(200_000_000, 0)])),
      http.get(FEE_URL, () => HttpResponse.json(FEE_ESTIMATE)),
      http.get(BLOCKDAG_URL, () => HttpResponse.json(DAG_INFO)),
    );

    const fees = await estimateFees(intent);

    expect(typeof fees.value).toBe("bigint");
    expect(fees.value).toBeGreaterThan(0n);
  });

  it("propagates a crafting failure (no spendable UTXOs)", async () => {
    server.use(
      http.post(UTXOS_URL, () => HttpResponse.json([])),
      http.get(FEE_URL, () => HttpResponse.json(FEE_ESTIMATE)),
      http.get(BLOCKDAG_URL, () => HttpResponse.json(DAG_INFO)),
    );

    await expect(estimateFees(intent)).rejects.toThrow("no spendable UTXOs");
  });
});
