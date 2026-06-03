import { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { randomBytes } from "crypto";
import coinConfig from "../config";
import { getChainParameters, getTronAccountNetwork } from "../network";
import { encode58Check } from "../network/format";
import { estimateFees } from "./estimateFees";

const USDT_CONTRACT = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
// SR account — staked TRX for both resources absorbs all per-tx fees.
const SUPER_REPRESENTATIVE = "TJvaAeFb8Lykt9RQcVyyTFN2iDvGMuyD4M";
const ACTIVE_RECIPIENT = "TPswDDCAWhJAZGdHPidFg5nEf8TkNToDX1";
// BitTorrent (BTT) TRC10 — long-lived asset useful for end-to-end testing.
const BTT_ASSET = "1002000";

// Collision with an existing on-chain account is ~2^-160.
const freshAddress = (): string => encode58Check("41" + randomBytes(20).toString("hex"));

const sendIntent = (overrides: Partial<TransactionIntent>): TransactionIntent => ({
  intentType: "transaction",
  type: "send",
  sender: SUPER_REPRESENTATIVE,
  recipient: ACTIVE_RECIPIENT,
  amount: BigInt(1),
  asset: { type: "native" },
  ...overrides,
});

describe("estimateFees [integ]", () => {
  beforeAll(() => {
    coinConfig.setCoinConfig(() => ({
      status: { type: "active" },
      explorer: { url: "https://tron.coin.ledger.com" },
    }));
  });

  describe("sanity", () => {
    // If this fails, the SR changed its staking policy — pick another one.
    it("the Super Representative has enough bandwidth and energy to absorb tx-level fees", async () => {
      const info = await getTronAccountNetwork(SUPER_REPRESENTATIVE);

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
        const fee = await estimateFees(sendIntent({ recipient: ACTIVE_RECIPIENT }));

        expect(fee).toBe(0n);
      });

      it("to a fresh recipient costs exactly createAccountFee + createNewAccountFeeInSystemContract", async () => {
        const [fee, params] = await Promise.all([
          estimateFees(sendIntent({ recipient: freshAddress() })),
          getChainParameters(),
        ]);

        expect(fee).toBe(
          BigInt(params.createAccountFee + params.createNewAccountFeeInSystemContract),
        );
      });
    });

    describe("TRC10", () => {
      it("to an active recipient costs 0", async () => {
        const fee = await estimateFees(
          sendIntent({ asset: { type: "trc10", assetReference: BTT_ASSET } }),
        );

        expect(fee).toBe(0n);
      });
    });

    describe("TRC20", () => {
      it("to an active recipient costs 0", async () => {
        const fee = await estimateFees(
          sendIntent({ asset: { type: "trc20", assetReference: USDT_CONTRACT } }),
        );

        expect(fee).toBe(0n);
      });

      it("to a fresh recipient costs 0 — no native activation fee for contracts", async () => {
        const fee = await estimateFees(
          sendIntent({
            recipient: freshAddress(),
            asset: { type: "trc20", assetReference: USDT_CONTRACT },
          }),
        );

        expect(fee).toBe(0n);
      });
    });

    it("is deterministic — same intent twice returns the same fee", async () => {
      const intent = sendIntent({
        asset: { type: "trc20", assetReference: USDT_CONTRACT },
      });

      const [first, second] = await Promise.all([estimateFees(intent), estimateFees(intent)]);

      expect(first).toBe(second);
    });
  });
});
