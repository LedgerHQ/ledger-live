import { http, HttpResponse } from "msw";
import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { craftTransaction } from "./craftTransaction";
import { server, useMswServer, testNetworkApi, TEST_API } from "../tests/msw";

const SENDER = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const RECIPIENT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

describe("craftTransaction (msw)", () => {
  useMswServer();

  it("fetches nonce and chainID from the network and serializes them into the tx", async () => {
    server.use(
      http.get(`${TEST_API}/accounts/:addr`, () =>
        HttpResponse.json({ balance: "0", nonce: 9, isGuarded: false }),
      ),
      http.get(`${TEST_API}/network/config`, () =>
        HttpResponse.json({
          data: {
            config: {
              erd_chain_id: "D",
              erd_denomination: 18,
              erd_min_gas_limit: 50000,
              erd_min_gas_price: 1000000000,
              erd_gas_per_data_byte: 1500,
              erd_gas_price_modifier: "0.01",
            },
          },
        }),
      ),
    );

    const intent: TransactionIntent = {
      intentType: "transaction",
      type: "send",
      sender: SENDER,
      recipient: RECIPIENT,
      amount: 1000000000000000000n,
      asset: { type: "native" },
    };

    const result = await craftTransaction(testNetworkApi(), intent);
    const tx = JSON.parse(result.transaction);

    expect(tx.nonce).toBe(9);
    expect(tx.chainID).toBe("D"); // devnet chainID from the network config, not hardcoded
    expect(tx.receiver).toBe(RECIPIENT);
    expect(tx.value).toBe("1000000000000000000");
  });
});
