import { http, HttpResponse } from "msw";
import { explorerAddress, isCashaddrRecipient, shownRecipient } from "../cashaddr";
import { getBalance } from "../getBalance";
import { getSpendableUtxos } from "../getSpendableUtxos";
import { listOperations } from "../listOperations";
import { cryptoFor } from "../selectUtxos";
import {
  balanceHandler,
  explorerUrl,
  makeTx,
  pendingUtxosHandler,
  server,
  testConfig,
  testContext,
  useMswServer,
  utxosHandler,
} from "./helpers/msw";

useMswServer();

// A Bitcoin Cash P2PKH address: prefixless, as Ledger Wallet stores it, and prefixed.
const PREFIXLESS = "qzf9ax7we6swngffah3e9gr4mgh0qw3zcy6kq5afau";
const PREFIXED = `bitcoincash:${PREFIXLESS}`;
const LEGACY = "1ELvzXiviKRJ54rMqEEDxJbVU6bYnfFrVY";

const bch = () => testConfig("bitcoin_cash", { explorerId: "bch" });

describe("cashaddr helpers", () => {
  it("prefixes a prefixless cashaddr address for a cashaddr currency only", () => {
    expect(explorerAddress(bch(), PREFIXLESS)).toBe(PREFIXED);
    expect(explorerAddress(bch(), PREFIXED)).toBe(PREFIXED);
    expect(explorerAddress(bch(), LEGACY)).toBe(LEGACY);
    // No `addressFormat` in the config: the address is used as given.
    expect(explorerAddress(testConfig("litecoin"), PREFIXLESS)).toBe(PREFIXLESS);
  });

  it("tells a cashaddr P2PKH recipient from a legacy one", () => {
    expect(isCashaddrRecipient(PREFIXED)).toBe(true);
    expect(isCashaddrRecipient(PREFIXLESS)).toBe(true);
    expect(isCashaddrRecipient(LEGACY)).toBe(false);
  });

  it("shows a P2PKH output script as its cashaddr address", () => {
    const script = cryptoFor("bitcoin_cash").toOutputScript(LEGACY);
    expect(shownRecipient(script)).toBe(PREFIXED);
    expect(shownRecipient(Buffer.from("0014", "hex"))).toBe("");
  });
});

describe("Bitcoin Cash reads with the prefixless form Ledger Wallet stores", () => {
  const context = testContext({ explorerId: "bch" });

  it("queries the balance with the prefixed form", async () => {
    server.use(balanceHandler(PREFIXED, "1234", "bch"));
    await expect(getBalance(context, "bitcoin_cash", PREFIXLESS)).resolves.toEqual([
      { value: 1234n, asset: { type: "native" } },
    ]);
  });

  it("queries the UTXOs and the mempool view with the prefixed form", async () => {
    server.use(
      utxosHandler(
        PREFIXED,
        [
          {
            data: [{ txId: "a".repeat(64), outputIndex: 0, value: "100", height: 1 }],
            token: null,
          },
        ],
        "bch",
      ),
      pendingUtxosHandler(PREFIXED, {}, "bch"),
    );
    const utxos = await getSpendableUtxos(bch(), PREFIXLESS);
    expect(utxos.map(utxo => utxo.value)).toEqual(["100"]);
  });

  it("lists the history of the prefixed form, matching the addresses the explorer echoes", async () => {
    server.use(
      http.get(`${explorerUrl("bch")}/address/${PREFIXED}/txs`, () =>
        HttpResponse.json({
          data: [
            makeTx("b".repeat(64), {
              fees: "100",
              block: { hash: "c".repeat(64), height: 900_000, time: "2026-10-01T00:00:00Z" },
              inputs: [{ address: LEGACY, value: "5000", output_index: 0 }],
              outputs: [{ address: PREFIXED, value: "4900", output_index: 0 }],
            }),
          ],
          token: null,
        }),
      ),
    );
    const { items } = await listOperations(context, "bitcoin_cash", PREFIXLESS, { minHeight: 0 });
    expect(items.map(op => [op.type, op.value])).toEqual([["IN", 4900n]]);
  });
});
