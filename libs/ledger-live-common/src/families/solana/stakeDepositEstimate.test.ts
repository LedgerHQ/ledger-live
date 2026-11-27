import BigNumber from "bignumber.js";
import { ComputeBudgetProgram, StakeProgram, type VersionedMessage } from "@solana/web3.js";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { asDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { Account, Operation } from "@ledgerhq/types-live";
import { getAccountBridge } from "../../bridge/impl";
import { liveConfig } from "../../config/sharedConfig";
import { estimateSolanaStakeDepositMax } from "./stakeDepositEstimate";
import { createStakeAccountTransaction } from "./transactions";

type Phase = "estimate" | "prepare" | "validate";
type MessageKind = "create" | "undelegate" | "withdraw";

const STAKE_INSTRUCTION_WITHDRAW = 4;
const STAKE_INSTRUCTION_DEACTIVATE = 5;
const SET_COMPUTE_UNIT_PRICE = 3;
const COMPUTE_UNITS_PER_MESSAGE = 200_000;
const SOL = 1_000_000_000;

/** A Solana network the tests move around: what the RPC answers, and when it fails. */
type ChainState = {
  baseFee: number;
  recentPriorityFee: number;
  rent: number;
  minimumDelegation: number;
  /** The phase of the estimate that is running: set by the bridge wrapper below. */
  phase: Phase;
  /** Extra lamports every fee costs while a phase runs, to model a fee that moves between calls. */
  feeBump: Partial<Record<Phase, number>>;
  failing: { createFee: Phase[]; unstakeFees: Phase[]; rent: Phase[]; minimumDelegation: Phase[] };
  /** Reshapes what the bridge answers as send-max and as prepared transaction, to model an incomplete estimation. */
  reshapeMaxSpendable: (maxSpendable: BigNumber) => BigNumber;
  reshapePrepared: (prepared: PreparedShape) => PreparedShape;
};

type PreparedShape = Record<string, unknown> & { feeParameters?: Record<string, unknown> };

/** The prepared transaction, with another reserve for the unstake in its fee parameters. */
const withReserve = (prepared: PreparedShape, reserve: unknown): PreparedShape => ({
  ...prepared,
  feeParameters: { ...prepared.feeParameters, reserve },
});

const initialChain = (): ChainState => ({
  baseFee: 5_000,
  recentPriorityFee: 0,
  rent: 2_282_880,
  minimumDelegation: SOL,
  phase: "estimate",
  feeBump: {},
  failing: { createFee: [], unstakeFees: [], rent: [], minimumDelegation: [] },
  reshapeMaxSpendable: maxSpendable => maxSpendable,
  reshapePrepared: prepared => prepared,
});

const chain = initialChain();

function resetChain() {
  Object.assign(chain, initialChain());
}

function kindOf(message: VersionedMessage): MessageKind {
  const stake = message.compiledInstructions.find(instruction =>
    message.staticAccountKeys[instruction.programIdIndex].equals(StakeProgram.programId),
  );
  if (!stake) return "create";
  const type = Buffer.from(stake.data).readUInt32LE(0);
  if (type === STAKE_INSTRUCTION_DEACTIVATE) return "undelegate";
  return type === STAKE_INSTRUCTION_WITHDRAW ? "withdraw" : "create";
}

/** Prices the compute budget the way the RPC does: the unit price over the default unit limit. */
function priorityFeeOf(message: VersionedMessage): number {
  const priced = message.compiledInstructions.find(
    instruction =>
      message.staticAccountKeys[instruction.programIdIndex].equals(
        ComputeBudgetProgram.programId,
      ) && instruction.data[0] === SET_COMPUTE_UNIT_PRICE,
  );
  if (!priced) return 0;
  const microLamports = Number(Buffer.from(priced.data).readBigUInt64LE(1));
  return Math.ceil((microLamports * COMPUTE_UNITS_PER_MESSAGE) / 1_000_000);
}

function failsNow(phases: Phase[]): boolean {
  return phases.includes(chain.phase);
}

const fakeChainApi = {
  config: {},
  getLatestBlockhash: async () => ({ blockhash: "blockhash", lastValidBlockHeight: 100 }),
  getRecentPrioritizationFees: async () => [
    { slot: 1, prioritizationFee: chain.recentPriorityFee },
  ],
  getSimulationComputeUnits: async () => null,
  getFeeForMessage: async (message: VersionedMessage) => {
    const isCreation = kindOf(message) === "create";
    if (failsNow(isCreation ? chain.failing.createFee : chain.failing.unstakeFees)) {
      throw new Error("RPC unavailable");
    }
    return chain.baseFee + priorityFeeOf(message) + (chain.feeBump[chain.phase] ?? 0);
  },
  getMinimumBalanceForRentExemption: async () => {
    if (failsNow(chain.failing.rent)) throw new Error("RPC unavailable");
    return chain.rent;
  },
  getStakeMinimumDelegation: async () => {
    if (failsNow(chain.failing.minimumDelegation)) throw new Error("RPC unavailable");
    return chain.minimumDelegation;
  },
};

jest.mock("@ledgerhq/coin-solana/network/index", () => ({
  ...jest.requireActual("@ledgerhq/coin-solana/network/index"),
  getChainAPI: () => fakeChainApi,
}));

/** The real bridge, told which phase of the estimate each of its calls belongs to. */
async function getAccountBridgeInPhases(...args: unknown[]) {
  chain.phase = "estimate";
  const bridge = await jest.requireActual("../../bridge/impl").getAccountBridge(...args);
  return {
    ...bridge,
    estimateMaxSpendable: async (...params: unknown[]) => {
      chain.phase = "estimate";
      return chain.reshapeMaxSpendable(await bridge.estimateMaxSpendable(...params));
    },
    prepareTransaction: async (...params: unknown[]) => {
      chain.phase = "prepare";
      return chain.reshapePrepared(await bridge.prepareTransaction(...params));
    },
    getTransactionStatus: (...params: unknown[]) => {
      chain.phase = "validate";
      return bridge.getTransactionStatus(...params);
    },
  };
}

jest.mock(
  "../../bridge/impl",
  () =>
    new Proxy(
      {},
      {
        get: (_target, name) =>
          name === "getAccountBridge"
            ? getAccountBridgeInPhases
            : jest.requireActual("../../bridge/impl")[name],
      },
    ),
);

beforeAll(() => {
  LiveConfig.setConfig(liveConfig);
});

beforeEach(resetChain);

const ADDRESS = "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM";

function solanaAccount(
  spendableLamports: number,
  pendingOperations: Operation[] = [],
  overrides: Partial<Account> = {},
): Account {
  const account = genAccount("stake-deposit-estimate", {
    currency: getCryptoCurrencyById("solana"),
    operationsSize: 0,
    subAccountsCount: 0,
  });
  return {
    ...account,
    id: `js:2:solana:${ADDRESS}:solanaMain`,
    freshAddress: ADDRESS,
    derivationMode: asDerivationMode("solanaMain"),
    balance: new BigNumber(spendableLamports),
    spendableBalance: new BigNumber(spendableLamports),
    pendingOperations,
    subAccounts: [],
    ...overrides,
  };
}

function pendingSend(valueLamports: number, feeLamports: number): Operation {
  return {
    id: "pending-send",
    hash: "pending-send-hash",
    type: "OUT",
    value: new BigNumber(valueLamports),
    fee: new BigNumber(feeLamports),
    senders: [ADDRESS],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: `js:2:solana:${ADDRESS}:solanaMain`,
    date: new Date(0),
    extra: {},
  };
}

/** What the host's own validation says about a typed stake amount, name of the amount error if any. */
async function amountErrorOf(account: Account, lamports: BigNumber): Promise<string | undefined> {
  const bridge = await getAccountBridge(account);
  const draft = bridge.updateTransaction(
    bridge.createTransaction(account),
    createStakeAccountTransaction("", lamports),
  );
  const prepared = await bridge.prepareTransaction(account, draft);
  const status = await bridge.getTransactionStatus(account, prepared);
  return status.errors.amount?.name;
}

// 3 messages priced at the base fee plus the priority fee of the 10,000 floor over 200,000 units
const FEE_OF_ONE_MESSAGE = 5_000 + 2_000;
const FEE_WITH_UNSTAKE_RESERVE = 3 * FEE_OF_ONE_MESSAGE;

describe("estimateSolanaStakeDepositMax", () => {
  describe("the largest amount the host accepts", () => {
    it("is the balance minus the creation fee, the unstake reserve and the stake account rent", async () => {
      const max = await estimateSolanaStakeDepositMax(solanaAccount(10 * SOL));

      expect(max.toFixed()).toBe(String(10 * SOL - FEE_WITH_UNSTAKE_RESERVE - chain.rent));
    });

    it.each([1.5, 2, 10, 123.456789])(
      "passes the host validation at the maximum and fails with NotEnoughBalance one lamport above it (%s SOL)",
      async sol => {
        const account = solanaAccount(Math.round(sol * SOL));

        const max = await estimateSolanaStakeDepositMax(account);

        expect(await amountErrorOf(account, max)).toBeUndefined();
        expect(await amountErrorOf(account, max.plus(1))).toBe("NotEnoughBalance");
      },
    );

    it("keeps the pending debits of a transaction still being broadcast out of the maximum", async () => {
      const account = solanaAccount(10 * SOL, [pendingSend(3 * SOL, 5_000)]);

      const max = await estimateSolanaStakeDepositMax(account);

      expect(max.toFixed()).toBe(
        String(10 * SOL - 3 * SOL - 5_000 - FEE_WITH_UNSTAKE_RESERVE - chain.rent),
      );
      expect(await amountErrorOf(account, max)).toBeUndefined();
      expect(await amountErrorOf(account, max.plus(1))).toBe("NotEnoughBalance");
    });

    it("answers zero, without failing, when the balance cannot cover the fee, the reserve and the rent", async () => {
      const covered = FEE_WITH_UNSTAKE_RESERVE + chain.rent;

      await expect(estimateSolanaStakeDepositMax(solanaAccount(covered - 1))).resolves.toEqual(
        new BigNumber(0),
      );
      await expect(estimateSolanaStakeDepositMax(solanaAccount(0))).resolves.toEqual(
        new BigNumber(0),
      );
    });

    it("answers the single lamport that the balance leaves above those costs", async () => {
      const account = solanaAccount(FEE_WITH_UNSTAKE_RESERVE + chain.rent + 1);

      const max = await estimateSolanaStakeDepositMax(account);

      expect(max.toFixed()).toBe("1");
    });

    it("still answers with the funds when they are below the minimum delegation, which is a separate rule", async () => {
      const account = solanaAccount(SOL / 2);

      const max = await estimateSolanaStakeDepositMax(account);

      expect(max.toFixed()).toBe(String(SOL / 2 - FEE_WITH_UNSTAKE_RESERVE - chain.rent));
      expect(await amountErrorOf(account, max)).toBe("SolanaStakeAccountAmountTooLow");
    });
  });

  describe("no constant stands in for the network", () => {
    it("follows a doubled stake account rent", async () => {
      const account = solanaAccount(10 * SOL);
      const before = await estimateSolanaStakeDepositMax(account);

      chain.rent *= 2;
      const after = await estimateSolanaStakeDepositMax(account);

      expect(before.minus(after).toFixed()).toBe("2282880");
    });

    it("follows a doubled priority fee, which every one of the three messages pays", async () => {
      const account = solanaAccount(10 * SOL);
      const before = await estimateSolanaStakeDepositMax(account);

      chain.recentPriorityFee = 20_000;
      const after = await estimateSolanaStakeDepositMax(account);

      expect(before.minus(after).toFixed()).toBe(String(3 * 2_000));
    });

    it("follows a base fee that moved between two estimates", async () => {
      const account = solanaAccount(10 * SOL);
      const before = await estimateSolanaStakeDepositMax(account);

      chain.baseFee += 1_000;
      const after = await estimateSolanaStakeDepositMax(account);

      expect(before.minus(after).toFixed()).toBe(String(3 * 1_000));
    });

    it("lets a maximum from before a fee increase fail the host validation, and a new estimate recover", async () => {
      const account = solanaAccount(10 * SOL);
      const stale = await estimateSolanaStakeDepositMax(account);

      chain.baseFee += 1_000;

      expect(await amountErrorOf(account, stale)).toBe("NotEnoughBalance");
      const renewed = await estimateSolanaStakeDepositMax(account);
      expect(await amountErrorOf(account, renewed)).toBeUndefined();
    });
  });

  describe("a component that is unavailable fails the estimate", () => {
    it.each<[string, Partial<ChainState["failing"]>]>([
      ["the creation fee at estimation", { createFee: ["estimate"] }],
      ["the creation fee at preparation", { createFee: ["prepare"] }],
      ["the stake account rent at estimation", { rent: ["estimate"] }],
      ["the stake account rent at preparation", { rent: ["prepare"] }],
      [
        "any figure, at any step",
        {
          createFee: ["estimate", "prepare", "validate"],
          unstakeFees: ["estimate", "prepare", "validate"],
          rent: ["estimate", "prepare", "validate"],
          minimumDelegation: ["estimate", "prepare", "validate"],
        },
      ],
    ])("rejects when %s cannot be read", async (_name, failing) => {
      chain.failing = { ...chain.failing, ...failing };

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).rejects.toThrow(
        "RPC unavailable",
      );
    });

    it("never turns an estimation that failed into a zero or a spendable-balance quote", async () => {
      chain.failing.createFee = ["estimate", "prepare", "validate"];
      chain.failing.rent = ["estimate", "prepare", "validate"];

      const outcome = await estimateSolanaStakeDepositMax(solanaAccount(10 * SOL)).then(
        value => ({ value }),
        (error: unknown) => ({ error }),
      );

      expect(outcome).toHaveProperty("error");
      expect(outcome).not.toHaveProperty("value");
    });

    it("rejects when the unstake reserve of the prepared transaction could not be priced", async () => {
      chain.failing.unstakeFees = ["estimate", "prepare"];

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).rejects.toMatchObject({
        name: "SolanaStakeDepositEstimateError",
        reason: "unstake_reserve_unavailable",
      });
    });

    it("rejects when only the preparation could not price the unstake reserve", async () => {
      chain.failing.unstakeFees = ["prepare"];

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).rejects.toMatchObject({
        reason: "unstake_reserve_unavailable",
      });
    });

    it.each<[string, Partial<Account>]>([
      ["a spendable balance that is not a number", { spendableBalance: new BigNumber(NaN) }],
      ["pending operations that are missing", { pendingOperations: undefined }],
    ])("rejects an account with %s", async (_name, overrides) => {
      const account = solanaAccount(10 * SOL, [], overrides);

      await expect(estimateSolanaStakeDepositMax(account)).rejects.toMatchObject({
        reason: "balance_unavailable",
      });
    });

    it("rejects a stake account rent of zero, which no real network answers", async () => {
      chain.rent = 0;

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).rejects.toMatchObject({
        reason: "rent_unavailable",
      });
    });

    it("rejects a bridge send-max that is not an amount", async () => {
      chain.reshapeMaxSpendable = () => new BigNumber(NaN);

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).rejects.toMatchObject({
        reason: "balance_unavailable",
      });
    });
  });

  describe("an estimation that comes back incomplete", () => {
    it.each<[string, string, (prepared: PreparedShape) => PreparedShape]>([
      ["without a fee", "fee_unavailable", prepared => ({ ...prepared, fees: null })],
      [
        "with a fee of zero",
        "fee_unavailable",
        prepared => ({ ...prepared, fees: new BigNumber(0) }),
      ],
      [
        "with a fee that is not an amount",
        "fee_unavailable",
        prepared => ({ ...prepared, fees: "?" }),
      ],
      [
        "without any fee parameter",
        "unstake_reserve_unavailable",
        prepared => ({ ...prepared, feeParameters: undefined }),
      ],
      [
        "with a reserve that is not a whole amount",
        "unstake_reserve_unavailable",
        prepared => withReserve(prepared, "12.5"),
      ],
      [
        "with a reserve that is not a number",
        "unstake_reserve_unavailable",
        prepared => withReserve(prepared, {}),
      ],
      [
        "with a reserve below the fee",
        "unstake_reserve_unavailable",
        prepared => withReserve(prepared, "1"),
      ],
      [
        "without the rent",
        "rent_unavailable",
        prepared => ({ ...prepared, stakeAccountRent: undefined }),
      ],
      [
        "with a rent of zero",
        "rent_unavailable",
        prepared => ({ ...prepared, stakeAccountRent: new BigNumber(0) }),
      ],
    ])("rejects a prepared transaction %s", async (_name, reason, reshape) => {
      chain.reshapePrepared = reshape;

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).rejects.toMatchObject({
        reason,
      });
    });

    it.each<[string, (reserve: unknown) => unknown]>([
      ["a string", reserve => String(reserve)],
      ["a number", reserve => Number(reserve)],
      ["a bigint", reserve => BigInt(String(reserve))],
    ])("reads the reserve of the estimation as %s", async (_name, convert) => {
      const account = solanaAccount(10 * SOL);
      const expected = await estimateSolanaStakeDepositMax(account);

      chain.reshapePrepared = prepared =>
        withReserve(prepared, convert(prepared.feeParameters?.reserve));

      await expect(estimateSolanaStakeDepositMax(account)).resolves.toEqual(expected);
    });

    it("answers zero when the prepared estimation prices more than the balance holds", async () => {
      chain.reshapePrepared = prepared => withReserve(prepared, 100 * SOL);

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).resolves.toEqual(
        new BigNumber(0),
      );
    });
  });

  describe("estimation and validation that disagree", () => {
    it("does not quote the amount of an estimation that saw no unstake reserve when the preparation sees it", async () => {
      const account = solanaAccount(10 * SOL);
      const expected = await estimateSolanaStakeDepositMax(account);

      chain.failing.unstakeFees = ["estimate"];
      const max = await estimateSolanaStakeDepositMax(account);
      chain.failing.unstakeFees = [];

      expect(max.toFixed()).toBe(expected.toFixed());
      expect(await amountErrorOf(account, max)).toBeUndefined();
    });

    it("does not quote it either when the validation saw no reserve, which would let the amount through", async () => {
      const account = solanaAccount(10 * SOL);
      const expected = await estimateSolanaStakeDepositMax(account);

      chain.failing.unstakeFees = ["estimate", "validate"];
      const max = await estimateSolanaStakeDepositMax(account);
      chain.failing.unstakeFees = [];

      expect(max.toFixed()).toBe(expected.toFixed());
      expect(await amountErrorOf(account, max)).toBeUndefined();
    });

    it("keeps the rent in the quote when the validation saw none", async () => {
      const account = solanaAccount(10 * SOL);
      const expected = await estimateSolanaStakeDepositMax(account);

      chain.failing.rent = ["validate"];
      const max = await estimateSolanaStakeDepositMax(account);
      chain.failing.rent = [];

      expect(max.toFixed()).toBe(expected.toFixed());
      expect(await amountErrorOf(account, max)).toBeUndefined();
    });

    it("rejects the amount that the host validation refuses because a fee rose after the preparation", async () => {
      chain.feeBump = { validate: 1_000 };

      await expect(estimateSolanaStakeDepositMax(solanaAccount(10 * SOL))).rejects.toMatchObject({
        name: "SolanaStakeDepositEstimateError",
        reason: "candidate_refused",
      });
    });
  });

  describe("the minimum delegation", () => {
    it("is not needed to answer: an RPC that cannot tell it still gives the maximum", async () => {
      const account = solanaAccount(10 * SOL);
      const expected = await estimateSolanaStakeDepositMax(account);

      chain.failing.minimumDelegation = ["estimate", "prepare", "validate"];
      const max = await estimateSolanaStakeDepositMax(account);

      expect(max.toFixed()).toBe(expected.toFixed());
    });
  });
});
