import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import coinConfig, { cosmosDefaults } from "../../config";
import { estimateFees } from "./estimateFees";

const SENDER = "cosmos1w2q5xd8nhylu4vj28vpzfgag7msfxf0vx88wfq";

const sendIntent = {
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: "cosmos1recipient00000000000000000000000000",
  amount: 1_000_000n,
  asset: { type: "native" },
} as unknown as TransactionIntent;

describe("estimateFees (integ, Cosmos Hub)", () => {
  it("simulates a send and returns a positive fee estimate (simulation only — never signs or broadcasts)", async () => {
    const config = cosmosDefaults.cosmos;
    coinConfig.setCoinConfig(() => cosmosDefaults.cosmos);

    const fees = await estimateFees(config, "cosmos", sendIntent);

    expect(typeof fees.value).toBe("bigint");
    expect(fees.value > 0n).toBe(true);
    expect(fees.parameters?.gasLimit).not.toBeUndefined();
  });
});
