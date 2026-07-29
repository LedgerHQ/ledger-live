import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { makeTestApi, TEST_COSMOS_ENDPOINT } from "../../test/msw.mock";
import { craftTransaction, CosmosCraftedTransaction } from "./craftTransaction";

const SENDER = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: "cosmos1recipient00000000000000000000000000",
  amount: 1_000_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

describe("craftTransaction (integ, Cosmos Hub)", () => {
  it("produces a non-empty, JSON-parseable crafted transaction for a minimal send intent", async () => {
    const api = makeTestApi("cosmos", TEST_COSMOS_ENDPOINT);

    const crafted = await craftTransaction(api, "cosmos", sendIntent);

    expect(typeof crafted.transaction).toBe("string");
    expect(crafted.transaction.length).toBeGreaterThan(0);
    const payload = JSON.parse(crafted.transaction) as CosmosCraftedTransaction;
    expect(payload.protoMsgs[0].typeUrl).toBe("/cosmos.bank.v1beta1.MsgSend");
    expect(payload.signable.length).toBeGreaterThan(0);
  });
});
