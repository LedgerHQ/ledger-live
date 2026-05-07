import "../../__tests__/test-helpers/setup.integration";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { evmConfig } from "../../families/evm/config";
import { genericGetAccountShape } from "./getAccountShape";

describe("genericGetAccountShape EVM", () => {
  /**
   * Non-regression: tx "0x9dccb00bead85d819e0828e0ce2ba361103d1400fea9f2851a4e28201cb1b3dc"
   * has only internal operations, so it must produce exactly one top-level entry (NONE) from
   * the perspective of 0x6F3Fb5425673adB4c8aE74f53117e90A0Db1cB79.
   */
  it("produces exactly one top-level operation for the internal-only transaction", async () => {
    LiveConfig.setConfig(evmConfig);

    const getAccountShape = genericGetAccountShape("evm", "local");
    const result = await getAccountShape(
      {
        address: "0x6F3Fb5425673adB4c8aE74f53117e90A0Db1cB79",
        currency: { id: "ethereum" },
        derivationMode: "",
      } as any,
      { paginationConfig: {}, blacklistedTokenIds: [] },
    );

    const txOps = result.operations?.filter(
      op =>
        op.hash.toLowerCase() ===
        "0x9dccb00bead85d819e0828e0ce2ba361103d1400fea9f2851a4e28201cb1b3dc",
    );
    expect(txOps).toEqual([
      expect.objectContaining({
        hash: "0x9dccb00bead85d819e0828e0ce2ba361103d1400fea9f2851a4e28201cb1b3dc",
        type: "NONE",
        // fee payer that sends ETH to the current address (0x6F3Fb5425673adB4c8aE74f53117e90A0Db1cB79)
        // via a smart contract (0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43, Coinbase 10)
        senders: ["0x7830c87C02e56AFf27FA8Ab1241711331FA86F43"],
        recipients: ["0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43"], // Coinbase 10
        internalOperations: [
          expect.objectContaining({
            hash: "0x9dccb00bead85d819e0828e0ce2ba361103d1400fea9f2851a4e28201cb1b3dc",
            type: "IN",
            senders: ["0xA9D1e08C7793af67e9d92fe308d5697FB81d3E43"], // Coinbase 10
            recipients: ["0x6F3Fb5425673adB4c8aE74f53117e90A0Db1cB79"], // current address
          }),
        ],
      }),
    ]);
  });
});
