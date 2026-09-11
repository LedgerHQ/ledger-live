import type { TronCoinConfig } from "../config";
import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { randomBytes } from "crypto";
import { getChainParameters, getTronAccountNetwork } from "../network";
import { encode58Check } from "../network/format";
import type { TronMemo, TronTxData } from "../types";
import { estimateFees, estimateTronifyFees } from "./estimateFees";

type TronIntent = TransactionIntent<TronMemo, TronTxData>;

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
// SR account — staked TRX for both resources absorbs all per-tx fees.
const SUPER_REPRESENTATIVE = "TJvaAeFb8Lykt9RQcVyyTFN2iDvGMuyD4M";
const ACTIVE_RECIPIENT = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";
// BitTorrent (BTT) TRC10 — long-lived asset useful for end-to-end testing.
const BTT_ASSET = "1002000";

// Collision with an existing on-chain account is ~2^-160.
const freshAddress = (): string => encode58Check("41" + randomBytes(20).toString("hex"));

const sendIntent = (overrides: Partial<TronIntent> = {}): TronIntent => ({
  intentType: "transaction",
  type: "send",
  sender: SUPER_REPRESENTATIVE,
  recipient: ACTIVE_RECIPIENT,
  amount: BigInt(1),
  asset: { type: "native" },
  data: { type: "tron" },
  ...overrides,
});

const mockConfig = {
  status: { type: "active" },
  explorer: { url: "https://tron.coin.ledger.com" },
} as TronCoinConfig;

describe("estimateFees [integ]", () => {
  describe("sanity", () => {
    // If this fails, the SR changed its staking policy — pick another one.
    it("the Super Representative has enough bandwidth and energy to absorb tx-level fees", async () => {
      const info = await getTronAccountNetwork(mockConfig, SUPER_REPRESENTATIVE);

      const bandwidth = info.freeNetLimit
        .minus(info.freeNetUsed)
        .plus(info.netLimit)
        .minus(info.netUsed);
      const energy = info.energyLimit.minus(info.energyUsed);

      expect(bandwidth.toNumber()).toBeGreaterThan(500);
      expect(energy.toNumber()).toBeGreaterThan(100_000);
    });
  });

  describe("Super Representative sender (bandwidth + energy fully covered)", () => {
    describe("native", () => {
      it("to an active recipient costs 0", async () => {
        const fee = await estimateFees(mockConfig, sendIntent({ recipient: ACTIVE_RECIPIENT }));

        expect(fee.value).toBe(0n);
      });

      it("to a fresh recipient costs exactly createAccountFee + createNewAccountFeeInSystemContract", async () => {
        const [fee, params] = await Promise.all([
          estimateFees(mockConfig, sendIntent({ recipient: freshAddress() })),
          getChainParameters(mockConfig),
        ]);

        expect(fee.value).toBe(
          BigInt(params.createAccountFee + params.createNewAccountFeeInSystemContract),
        );
      });
    });

    describe("TRC10", () => {
      it("to an active recipient costs 0", async () => {
        const fee = await estimateFees(
          mockConfig,
          sendIntent({ asset: { type: "trc10", assetReference: BTT_ASSET } }),
        );

        expect(fee.value).toBe(0n);
      });
    });

    describe("TRC20", () => {
      it("to an active recipient costs 0", async () => {
        const fee = await estimateFees(
          mockConfig,
          sendIntent({ asset: { type: "trc20", assetReference: USDT_CONTRACT } }),
        );

        expect(fee.value).toBe(0n);
      });

      it("to a fresh recipient costs 0 — no native activation fee for contracts", async () => {
        const fee = await estimateFees(
          mockConfig,
          sendIntent({
            recipient: freshAddress(),
            asset: { type: "trc20", assetReference: USDT_CONTRACT },
          }),
        );

        expect(fee.value).toBe(0n);
      });
    });

    it("is deterministic — same intent twice returns the same fee", async () => {
      const intent = sendIntent({
        asset: { type: "trc20", assetReference: USDT_CONTRACT },
      });

      const [first, second] = await Promise.all([
        estimateFees(mockConfig, intent),
        estimateFees(mockConfig, intent),
      ]);

      expect(first.value).toBe(second.value);
    });
  });
});

// estimateTronifyFees integ tests require a live Tronify provider wired into coinConfig, which
// is not available in standard CI. The Tronify code path is fully covered by unit tests in
// estimateFees.test.ts. Enable this block locally by pointing coinConfig at a real provider.
describe.skip("estimateTronifyFees [integ — requires live Tronify provider]", () => {
  it("returns value < originalValue for a USDT TRC-20 transfer with a cheap energy window", async () => {
    const intent = sendIntent({ asset: { type: "trc20", assetReference: USDT_CONTRACT } });

    const result = await estimateTronifyFees(mockConfig, intent);

    expect(typeof result.value).toBe("bigint");
    expect(typeof result.originalValue).toBe("bigint");
    expect(result.value).toBeGreaterThan(0n);
    expect(result.originalValue).toBeGreaterThan(0n);
    // savings may be 0 if Tronify is currently not cheaper — just assert it's non-negative
    expect(result.savings).toBeGreaterThanOrEqual(0n);
  });
});
