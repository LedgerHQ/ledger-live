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
import { craftTransaction, type UnsignedKaspaTransaction } from "./craftTransaction";

const UTXOS_URL = `${TEST_KASPA_ENDPOINT}/addresses/utxos`;
const FEE_URL = `${TEST_KASPA_ENDPOINT}/info/fee-estimate`;

function intent(overrides: Partial<TransactionIntent> = {}): TransactionIntent {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 150_000_000n,
    asset: { type: "native" },
    ...overrides,
  };
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("craftTransaction via MSW", () => {
  it("selects a UTXO and crafts a recipient + change output over the real HTTP path", async () => {
    server.use(
      http.post(UTXOS_URL, () => HttpResponse.json([makeApiUtxo(200_000_000, 0)])),
      http.get(FEE_URL, () => HttpResponse.json(FEE_ESTIMATE)),
    );

    const crafted = await craftTransaction(intent());
    const parsed: UnsignedKaspaTransaction = JSON.parse(crafted.transaction);

    expect(parsed.inputs).toHaveLength(1);
    expect(parsed.outputs).toHaveLength(2); // recipient + change
    expect(parsed.outputs[0].value).toBe(150_000_000);
    expect(Number(crafted.details?.fee)).toBeGreaterThan(0);
  });

  it("throws when the sender has no spendable UTXOs", async () => {
    server.use(
      http.post(UTXOS_URL, () => HttpResponse.json([])),
      http.get(FEE_URL, () => HttpResponse.json(FEE_ESTIMATE)),
    );

    await expect(craftTransaction(intent())).rejects.toThrow("no spendable UTXOs");
  });

  it("regression: picks an old, low-DAA UTXO over a fresh, high-DAA one across a digit-count boundary", async () => {
    // Real-world shape that broke the old lexicographic blockDaaScore sort: "1202" < "200" as
    // strings, so a fresh, immature 4-digit UTXO got selected ahead of a genuinely old, mature
    // 3-digit one. Both UTXOs alone can cover the send, so the sole way to tell them apart is
    // which one craftTransaction actually picked.
    server.use(
      http.post(UTXOS_URL, () =>
        HttpResponse.json([
          makeApiUtxo(200_000_000, 0, "1202"),
          makeApiUtxo(200_000_000, 1, "200"),
        ]),
      ),
      http.get(FEE_URL, () => HttpResponse.json(FEE_ESTIMATE)),
    );

    const crafted = await craftTransaction(intent());
    const parsed: UnsignedKaspaTransaction = JSON.parse(crafted.transaction);

    expect(parsed.inputs).toHaveLength(1);
    expect(parsed.inputs[0].outpointIndex).toBe(1); // the "200"-DAA UTXO, not the "1202" one
  });
});
