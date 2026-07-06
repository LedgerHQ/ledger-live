import type {
  BufferTxData,
  MemoNotSupported,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { CELO_STAKING_TYPES, isCeloStakingIntent } from "./stakingIntent";

const makeIntent = (
  overrides: Partial<TransactionIntent<MemoNotSupported, BufferTxData>>,
): TransactionIntent<MemoNotSupported, BufferTxData> => ({
  intentType: "transaction",
  type: "send",
  sender: "0x1111111111111111111111111111111111111111",
  recipient: "0x2222222222222222222222222222222222222222",
  amount: 1n,
  asset: { type: "native" },
  data: { type: "buffer", value: Buffer.from([]) },
  ...overrides,
});

describe("isCeloStakingIntent", () => {
  it("detects every celo.* staking type regardless of intentType", () => {
    for (const type of CELO_STAKING_TYPES) {
      // the generic-coin-framework builds these with intentType "transaction"
      expect(isCeloStakingIntent(makeIntent({ type, intentType: "transaction" }))).toBe(true);
      expect(isCeloStakingIntent(makeIntent({ type, intentType: "staking" }))).toBe(true);
    }
  });

  it("returns false for a plain send", () => {
    expect(isCeloStakingIntent(makeIntent({ type: "send" }))).toBe(false);
  });

  it("returns false for a canonical StakingOperation mode that is not a celo.* type", () => {
    // canonical framework modes are not our surface; only celo.* is
    expect(isCeloStakingIntent(makeIntent({ type: "delegate", intentType: "staking" }))).toBe(
      false,
    );
  });
});
