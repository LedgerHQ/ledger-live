import type {
  Balance,
  BufferTxData,
  FeeEstimation,
} from "@ledgerhq/coin-module-framework/api/index";

jest.mock("./estimateFees", () => ({ estimateFees: jest.fn() }));

import { estimateFees } from "./estimateFees";
import type { CeloStakingIntent, CeloStakingType } from "./stakingIntent";
import { validateStakingIntent } from "./validateStakingIntent";

const SENDER = "0x7777777777777777777777777777777777777777";
const GROUP = "0x4444444444444444444444444444444444444444";
const USDC_ADAPTER = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B";

const makeIntent = (
  type: CeloStakingType,
  overrides: Partial<CeloStakingIntent> = {},
): CeloStakingIntent =>
  ({
    intentType: "staking",
    type,
    sender: SENDER,
    recipient: "",
    amount: 0n,
    asset: { type: "native" },
    data: { type: "buffer", value: Buffer.from([]) } as BufferTxData,
    ...overrides,
  }) as CeloStakingIntent;

const nativeBalances = (value: bigint): Balance[] => [{ value, asset: { type: "native" } }];

const eip1559Fees = (value: bigint): FeeEstimation => ({
  value,
  parameters: { type: "eip1559", maxFeePerGas: 1n, maxPriorityFeePerGas: 1n, gasLimit: 5n },
});

describe("validateStakingIntent", () => {
  beforeEach(() => (estimateFees as jest.Mock).mockReset());

  it("accepts a lock intent covered by the native balance (amount + fees)", async () => {
    const res = await validateStakingIntent(
      makeIntent("celo.lock", { amount: 100n }),
      nativeBalances(1000n),
      eip1559Fees(10n),
    );

    expect(res.amount).toBe(100n);
    expect(res.totalSpent).toBe(110n);
    expect(res.estimatedFees).toBe(10n);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });

  it("flags an insufficient native balance", async () => {
    const res = await validateStakingIntent(
      makeIntent("celo.lock", { amount: 1000n }),
      nativeBalances(500n),
      eip1559Fees(10n),
    );

    expect(res.errors.amount).toBeInstanceOf(Error);
  });

  it("routes a fee-only shortfall to errors.fees, not errors.amount", async () => {
    const res = await validateStakingIntent(
      makeIntent("celo.register"),
      nativeBalances(5n),
      eip1559Fees(10n),
    );

    expect(res.errors.fees).toBeInstanceOf(Error);
    expect(res.errors.amount).toBeUndefined();
  });

  it("rejects a non-positive amount for amount-bearing operations", async () => {
    const res = await validateStakingIntent(
      makeIntent("celo.lock", { amount: 0n }),
      nativeBalances(1000n),
      eip1559Fees(10n),
    );

    expect(res.errors.amount).toBeInstanceOf(Error);
    expect(res.errors.amount.message).toMatch(/positive amount/);
  });

  it("flags a group operation missing its validator group", async () => {
    const res = await validateStakingIntent(
      makeIntent("celo.vote", { amount: 10n }),
      nativeBalances(1000n),
      eip1559Fees(10n),
    );

    expect(res.errors.recipient).toBeInstanceOf(Error);
  });

  it("excludes ERC-20 (CIP-64) fees from the native totalSpent", async () => {
    const res = await validateStakingIntent(
      makeIntent("celo.lock", { amount: 100n }),
      nativeBalances(1000n),
      {
        value: 999999n,
        parameters: { type: "cip64", feeCurrency: USDC_ADAPTER, gasLimit: 5n },
      } as FeeEstimation,
    );

    // fees are paid in USDC, so only the locked CELO amount counts as native spend
    expect(res.totalSpent).toBe(100n);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });

  it("estimates fees itself when no customFees are provided", async () => {
    (estimateFees as jest.Mock).mockResolvedValue({ value: 7n });
    const intent = makeIntent("celo.unlock", { amount: 5n });

    const res = await validateStakingIntent(intent, nativeBalances(1000n));

    expect(estimateFees).toHaveBeenCalledWith(intent);
    expect(res.estimatedFees).toBe(7n);
    // unlock moves 5 CELO of already-locked funds: amount reflects the operation,
    // but only gas is native-spent (unlock doesn't spend native), so totalSpent = fees
    expect(res.amount).toBe(5n);
    expect(res.totalSpent).toBe(7n);
  });

  it("does not count a vote's amount as native spend (moves already-locked funds)", async () => {
    const res = await validateStakingIntent(
      makeIntent("celo.vote", { valAddress: GROUP, amount: 100n }),
      nativeBalances(10n),
      eip1559Fees(5n),
    );

    // vote of 100 with only 10 native available must NOT error — it spends locked gold, not native
    expect(res.amount).toBe(100n);
    expect(res.totalSpent).toBe(5n);
    expect(Object.keys(res.errors)).toHaveLength(0);
  });
});
