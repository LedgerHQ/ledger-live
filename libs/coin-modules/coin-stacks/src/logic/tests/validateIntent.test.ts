import type {
  Balance,
  MemoNotSupported,
  StakingTransactionIntent,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/coin-module-framework/errors";
import { StacksStakeInPreparePhase } from "../../errors";
import { fetchPoxInfo } from "../../network/pox";
import type { StacksTxData } from "../../types";
import { MAX_NUM_CYCLES as LEGACY_MAX_NUM_CYCLES, validateIntent } from "../validateIntent";
import { MAX_NUM_CYCLES } from "../../common-logic/staking";

jest.mock("../../network/pox");

const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";

const nativeBalance = (value: bigint): Balance[] => [{ value, asset: { type: "native" } }];

const mockNextCycle = (blocksUntilPreparePhase: number, blocksUntilRewardPhase: number) =>
  (fetchPoxInfo as jest.Mock).mockResolvedValue({
    next_cycle: {
      blocks_until_prepare_phase: blocksUntilPreparePhase,
      blocks_until_reward_phase: blocksUntilRewardPhase,
    },
  });

function transferIntent(
  overrides: Partial<TransactionIntent<MemoNotSupported, StacksTxData>> = {},
): TransactionIntent<MemoNotSupported, StacksTxData> {
  return {
    intentType: "transaction",
    type: "send",
    sender: SENDER,
    recipient: RECIPIENT,
    amount: 1000n,
    asset: { type: "native" },
    data: { type: "stacks-pox" },
    ...overrides,
  };
}

describe("validateIntent", () => {
  it("keeps exporting pox-5's MAX_NUM_CYCLES from its public subpath", () => {
    expect(LEGACY_MAX_NUM_CYCLES).toBe(MAX_NUM_CYCLES);
  });

  it("flags a missing recipient", async () => {
    const { errors } = await validateIntent(
      transferIntent({ recipient: "" }),
      nativeBalance(10000n),
    );
    expect(errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("flags a malformed recipient address", async () => {
    const { errors } = await validateIntent(
      transferIntent({ recipient: "not-an-address" }),
      nativeBalance(10000n),
    );
    expect(errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("flags a recipient identical to the sender", async () => {
    const { errors } = await validateIntent(
      transferIntent({ recipient: SENDER }),
      nativeBalance(10000n),
    );
    expect(errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("flags a zero amount", async () => {
    const { errors } = await validateIntent(transferIntent({ amount: 0n }), nativeBalance(10000n));
    expect(errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("flags an amount exceeding the spendable balance", async () => {
    const { errors } = await validateIntent(
      transferIntent({ amount: 20000n }),
      nativeBalance(10000n),
    );
    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("passes a valid transfer and returns totalSpent = amount + fees", async () => {
    const result = await validateIntent(transferIntent({ amount: 1000n }), nativeBalance(10000n), {
      value: 200n,
    });
    expect(result.errors).toEqual({});
    expect(result.amount).toBe(1000n);
    expect(result.totalSpent).toBe(1200n);
  });

  it("resolves useAllAmount to balance minus fees", async () => {
    const result = await validateIntent(
      transferIntent({ useAllAmount: true, amount: 0n }),
      nativeBalance(10000n),
      { value: 200n },
    );
    expect(result.errors).toEqual({});
    expect(result.amount).toBe(9800n);
  });

  it("flags useAllAmount when the fee alone exceeds the balance", async () => {
    const result = await validateIntent(
      transferIntent({ useAllAmount: true, amount: 0n }),
      nativeBalance(100n),
      { value: 200n },
    );
    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("flags a token transfer when the fee exceeds the native balance", async () => {
    const balances: Balance[] = [
      { value: 500n, asset: { type: "native" } },
      { value: 100000n, asset: { type: "token", assetReference: "SP_CONTRACT.token-x::token-x" } },
    ];

    const result = await validateIntent(
      transferIntent({
        amount: 1000n,
        asset: { type: "token", assetReference: "SP_CONTRACT.token-x::token-x" },
      }),
      balances,
      { value: 900n },
    );

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  describe("staking", () => {
    function stakingIntent(
      overrides: Partial<StakingTransactionIntent<MemoNotSupported, StacksTxData>> = {},
    ): TransactionIntent<MemoNotSupported, StacksTxData> {
      return {
        intentType: "staking",
        type: "stake",
        mode: "delegate",
        sender: SENDER,
        recipient: SENDER,
        valAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.signer-manager",
        amount: 1000000n,
        asset: { type: "native" },
        data: { type: "stacks-pox" },
        ...overrides,
      };
    }

    it("flags a delegate intent missing numCycles/startBurnHt (craftTransaction would otherwise throw)", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ data: { type: "stacks-pox" } }),
        nativeBalance(10000000n),
      );
      expect(errors.data?.message).toMatch(/numCycles and startBurnHt are required/);
    });

    it("flags a delegate valAddress that isn't a contract principal (craftTransaction would otherwise throw)", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ valAddress: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9" }),
        nativeBalance(10000000n),
      );
      expect(errors.valAddress?.message).toMatch(/must be a contract principal/);
    });

    it("flags numCycles out of pox-5's 1-96 bound", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ data: { type: "stacks-pox", numCycles: 97, startBurnHt: 961600 } }),
        nativeBalance(10000000n),
      );
      expect(errors.data?.message).toMatch(/numCycles must be an integer between/);
    });

    it("flags a fractional numCycles, which uintCV can't encode", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ data: { type: "stacks-pox", numCycles: 1.5, startBurnHt: 961600 } }),
        nativeBalance(10000000n),
      );
      expect(errors.data?.message).toMatch(/numCycles must be an integer between/);
    });

    it.each([
      ["an invalid address part", "SP1not-an-address.signer-manager"],
      ["an empty contract name", "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9."],
    ])("flags a delegate valAddress with %s", async (_, valAddress) => {
      const { errors } = await validateIntent(
        stakingIntent({ valAddress }),
        nativeBalance(10000000n),
      );
      expect(errors.valAddress?.message).toMatch(/must be a contract principal/);
    });

    it("flags a zero amount for delegate (craftTransaction would otherwise stake 0 on-chain)", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ amount: 0n }),
        nativeBalance(10000000n),
      );
      expect(errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("flags an amount exceeding the spendable balance for delegate", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ amount: 20000000n }),
        nativeBalance(10000000n),
      );
      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("flags a delegate amount that leaves nothing to pay the separately-charged fee", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ amount: 10000000n }),
        nativeBalance(10000000n),
        { value: 200n },
      );
      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    describe("prepare phase", () => {
      const readyData = { type: "stacks-pox" as const, numCycles: 1, startBurnHt: 961566 };

      afterEach(() => jest.resetAllMocks());

      it("flags a delegate intent once the prepare phase has started (pox-5 would abort it)", async () => {
        mockNextCycle(-40, 60);
        const { errors } = await validateIntent(
          stakingIntent({ data: readyData }),
          nativeBalance(10000000n),
        );
        expect(errors.data).toBeInstanceOf(StacksStakeInPreparePhase);
        expect(errors.data).toMatchObject({ blocksUntilReopen: 60 });
      });

      it("flags a delegate intent on the prepare phase's first block", async () => {
        mockNextCycle(0, 100);
        const { errors } = await validateIntent(
          stakingIntent({ data: readyData }),
          nativeBalance(10000000n),
        );
        expect(errors.data).toBeInstanceOf(StacksStakeInPreparePhase);
      });

      it("passes a delegate intent during the reward phase", async () => {
        mockNextCycle(1, 101);
        const { errors } = await validateIntent(
          stakingIntent({ data: readyData }),
          nativeBalance(10000000n),
        );
        expect(errors.data).toBeUndefined();
      });

      it("skips the lookup while the intent has another data error", async () => {
        await validateIntent(
          stakingIntent({ data: { ...readyData, numCycles: 97 } }),
          nativeBalance(10000000n),
        );
        expect(fetchPoxInfo).not.toHaveBeenCalled();
      });

      it("skips the lookup for undelegate (pox-5 only gates stake)", async () => {
        await validateIntent(
          stakingIntent({ mode: "undelegate", data: readyData }),
          nativeBalance(10000000n),
        );
        expect(fetchPoxInfo).not.toHaveBeenCalled();
      });
    });

    it("does not check amount for undelegate (locked amount is fixed)", async () => {
      const { errors, amount } = await validateIntent(
        stakingIntent({ mode: "undelegate", amount: 999999999999n }),
        nativeBalance(0n),
      );
      expect(errors.amount).toBeUndefined();
      expect(amount).toBe(0n);
    });

    it("flags undelegate when there's not enough unlocked balance to pay the fee", async () => {
      const { errors } = await validateIntent(
        stakingIntent({ mode: "undelegate" }),
        nativeBalance(100n),
        { value: 200n },
      );
      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });
});
