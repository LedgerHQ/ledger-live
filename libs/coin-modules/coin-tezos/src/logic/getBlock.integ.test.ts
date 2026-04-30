import type { OtherBlockOperation } from "@ledgerhq/coin-module-framework/api/types";
import coinConfig, { type TezosCoinConfig } from "../config";
import { getBlock } from "./getBlock";

/**
 * Integration tests for getBlock against Shadownet (current Tezos testnet of record;
 * Ghostnet was deprecated in early 2026).
 * https://shadownet.tzkt.io
 *
 * Block 3113219 was chosen because it contains exactly one simple XTZ transfer
 * (1 mutez from a tz2 to a tz1), making the assertions deterministic.
 */

let originalGetCoinConfig: () => TezosCoinConfig;

const shadownetConfig = (): TezosCoinConfig =>
  ({
    status: { type: "active" },
    baker: { url: "https://tezos-bakers.api.live.ledger.com" },
    explorer: { url: "https://api.shadownet.tzkt.io", maxTxQuery: 100 },
    node: { url: "https://rpc.shadownet.teztnets.com" },
    fees: {
      minGasLimit: 0,
      minRevealGasLimit: 0,
      minStorageLimit: 0,
      minFees: 0,
      minEstimatedFees: 0,
    },
  }) as TezosCoinConfig;

describe("getBlock", () => {
  beforeAll(() => {
    originalGetCoinConfig = coinConfig.getCoinConfig;
    coinConfig.setCoinConfig(shadownetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it("should fetch and parse block 3113219 correctly", async () => {
    const block = await getBlock(3113219);

    expect(block.info).toMatchObject({
      hash: "BLAf8kVQvpsgXNA914eLo3gJKauywozjuravm7cmdvZ9VEM4QyK",
      height: 3113219,
      time: new Date("2026-04-29T08:27:12Z"),
      parent: {
        height: 3113218,
        hash: "BLtMGf5iBPGq2c98iXWVX6Z5xK4V227Sm7cCTjyiQ9ufRJRgBmf",
      },
    });

    expect(block.transactions).toHaveLength(1);

    const tx0 = block.transactions[0];
    expect(tx0.hash).toBe("onktfPphnYKAm7yJ2DLWPn3ZHKmx9U6sAiSYSwrpUUimL6ivbr5");
    expect(tx0.failed).toBe(false);
    expect(tx0.fees).toBe(1500n);
    expect(tx0.feesPayer).toBe("tz29GPjgeRQTRX6mcPQXkiuHnq7jbya1Abnq");

    expect(tx0.operations).toEqual(
      expect.arrayContaining([
        {
          type: "transfer",
          address: "tz29GPjgeRQTRX6mcPQXkiuHnq7jbya1Abnq",
          peer: "tz1dKrT1h6d7wP8fEzMPptG6er7mLLeQjBBY",
          asset: { type: "native", name: "XTZ" },
          amount: -1n,
        },
        {
          type: "transfer",
          address: "tz1dKrT1h6d7wP8fEzMPptG6er7mLLeQjBBY",
          peer: "tz29GPjgeRQTRX6mcPQXkiuHnq7jbya1Abnq",
          asset: { type: "native", name: "XTZ" },
          amount: 1n,
        },
      ]),
    );
  });
});

/**
 * Shadownet integration tests for Paris-style staking operations.
 *
 * Pinned blocks come from a chain-of-custody on `tz1dKrT1...` (faucet-funded test address):
 *   - 3106279: `stake` 500 XTZ to TF Test Baker
 *   - 3106307: `unstake` 250 XTZ
 *   - finalize: pending (`.todo` until the consensus-rights-delay window passes)
 */
const SHADOWNET_STAKER = "tz1dKrT1h6d7wP8fEzMPptG6er7mLLeQjBBY";
const SHADOWNET_BAKER = "tz3Q67aMz7gSMiQRcW729sXSfuMtkyAHYfqc";
const STAKE_BLOCK = 3106279;
const UNSTAKE_BLOCK = 3106307;

describe("getBlock — Shadownet Paris staking ops", () => {
  beforeAll(() => {
    if (originalGetCoinConfig === undefined) {
      originalGetCoinConfig = coinConfig.getCoinConfig;
    }
    coinConfig.setCoinConfig(shadownetConfig);
  });

  afterAll(() => {
    if (originalGetCoinConfig) {
      coinConfig.setCoinConfig(originalGetCoinConfig);
    }
  });

  it.each([
    [STAKE_BLOCK, "STAKE", 500_000_000n],
    [UNSTAKE_BLOCK, "UNSTAKE", 250_000_000n],
  ])(
    "block %s contains a staking op with operationType=%s and stakedAmount=%s",
    async (height, expectedOpType, expectedAmount) => {
      const block = await getBlock(height);
      const stakingTx = block.transactions.find(tx =>
        tx.operations.some(op => {
          const details = (op as OtherBlockOperation).details as
            | Record<string, unknown>
            | undefined;
          return details?.operationType === expectedOpType;
        }),
      );

      if (!stakingTx) throw new Error(`No ${expectedOpType} op found in block ${height}`);
      expect(stakingTx.feesPayer).toBe(SHADOWNET_STAKER);

      const stakingOp = stakingTx.operations[0] as OtherBlockOperation;
      const details = stakingOp.details as Record<string, unknown>;
      expect(stakingOp.type).toBe("other");
      expect(details.operationType).toBe(expectedOpType);
      expect(details.stakedAmount).toBe(expectedAmount);
      expect(details.delegate).toBe(SHADOWNET_BAKER);
      expect(details.ledgerOpType).toBe(expectedOpType);
    },
  );

  it.todo("block <FINALIZE_BLOCK> contains a FINALIZE_UNSTAKE op (enable once it lands)");
});
