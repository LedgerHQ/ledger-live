import type { Balance } from "@ledgerhq/coin-module-framework/api/index";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  InvalidTransactionError,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/coin-module-framework/errors";
import { MAX_NAT64, MIN_NEURON_STAKE } from "../consts";
import {
  ICPInvalidDissolveDelayIncrease,
  ICPStakeMemoNotRecoverable,
  InvalidMemoICP,
  NotEnoughTransferAmount,
} from "../errors";
import { getNeuronStakeSubAccountIdentifier } from "./buildNeuronTransaction";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey } from "./crypto";
import { findNeuronIdBySubaccount, queryLedgerBalance } from "../network/api";
import type { IcpIntent, IcpStakingIntent } from "./intent";
import { validateIntent, validateIntentWithStakeAccount } from "./validateIntent";

jest.mock("../network/api", () => ({
  ...jest.requireActual("../network/api"),
  findNeuronIdBySubaccount: jest.fn(),
  queryLedgerBalance: jest.fn(),
}));

const mockFindNeuron = jest.mocked(findNeuronIdBySubaccount);
const mockLedgerBalance = jest.mocked(queryLedgerBalance);

const SENDER = "e8a1474afbed438be8b019c4293b9e01b33075d72757ac715183ae7c7ba77e37";
const RECIPIENT = "5442dcadb1de34824e0a3000db6228ab21f3ad298caa1d910da0bd56d7f892a5";
const FEE = 10_000n;

const intent = (overrides: Partial<IcpIntent> = {}): IcpIntent => ({
  intentType: "transaction",
  type: "send",
  sender: SENDER,
  recipient: RECIPIENT,
  amount: 1_000n,
  asset: { type: "native" },
  ...overrides,
});

const native = (value: bigint, locked?: bigint): Balance[] => [
  { value, asset: { type: "native" }, ...(locked === undefined ? {} : { locked }) },
];

describe("validateIntent", () => {
  it("accepts a send the balance covers", () => {
    expect(validateIntent(intent(), native(1_000n + FEE))).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: FEE,
      amount: 1_000n,
      totalSpent: 1_000n + FEE,
    });
  });

  it("sends the balance net of the fee and of what is locked", () => {
    const result = validateIntent(
      intent({ useAllAmount: true, amount: 0n }),
      native(50_000n, 5_000n),
    );

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(50_000n - 5_000n - FEE);
    expect(result.totalSpent).toBe(50_000n - 5_000n);
  });

  it("does not spend what is locked", () => {
    const { errors } = validateIntent(intent(), native(1_000n + FEE, 1n));

    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("refuses to send the balance when the fee takes all of it", () => {
    const result = validateIntent(intent({ useAllAmount: true, amount: 0n }), native(FEE));

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    expect(result.amount).toBe(0n);
  });

  it.each([
    ["zero", 0n],
    ["negative", -1n],
  ])("requires an amount when it is %s", (_, amount) => {
    const { errors } = validateIntent(intent({ amount }), native(1_000_000n));

    expect(errors.amount).toBeInstanceOf(AmountRequired);
  });

  it.each([
    ["an amount", intent({ amount: 2n ** 64n })],
    ["the whole balance", intent({ useAllAmount: true, amount: 0n })],
  ])("refuses %s past the Nat64 range even when the balance covers it", (_, input) => {
    const { errors } = validateIntent(input, native(2n ** 64n + 2n * FEE));

    expect(errors.amount).toBeInstanceOf(InvalidTransactionError);
  });

  it.each([
    ["missing", "", RecipientRequired],
    ["invalid", "00".repeat(32), InvalidAddress],
    ["the sender", SENDER.toUpperCase(), InvalidAddressBecauseDestinationIsAlsoSource],
  ])("reports a recipient that is %s", (_, recipient, error) => {
    const { errors } = validateIntent(intent({ recipient }), native(1_000_000n));

    expect(errors.recipient).toBeInstanceOf(error);
  });

  it("reports an invalid sender", () => {
    const { errors } = validateIntent(intent({ sender: "abc" }), native(1_000_000n));

    expect(errors.sender).toBeInstanceOf(InvalidAddress);
  });

  it("reports an invalid memo", () => {
    const { errors } = validateIntent(
      intent({ memo: { type: "string", kind: "memo", value: "x" } } as Partial<IcpIntent>),
      native(1_000_000n),
    );

    expect(errors.transaction).toBeInstanceOf(InvalidMemoICP);
  });

  it.each([
    ["a staking intent", intent({ intentType: "staking" })],
    ["a neuron stake", intent({ type: "increase_stake" })],
    ["a token", intent({ asset: { type: "icrc1", assetReference: "x" } as IcpIntent["asset"] })],
  ])("reports %s as not supported", (_, input) => {
    const { errors } = validateIntent(input, native(1_000_000n));

    expect(errors.transaction).toBeInstanceOf(InvalidTransactionError);
  });

  it("reports a fee other than the ledger fee", () => {
    const { errors, estimatedFees } = validateIntent(intent(), native(1_000_000n), {
      value: 1n,
    });

    expect(errors.fees).toBeInstanceOf(InvalidTransactionError);
    expect(estimatedFees).toBe(FEE);
  });

  describe("for a neuron command", () => {
    const command = (overrides: Partial<IcpStakingIntent> = {}): IcpStakingIntent => ({
      ...intent(),
      intentType: "staking",
      type: "start_dissolving",
      mode: "delegate",
      valAddress: "123",
      recipient: "",
      amount: 0n,
      ...overrides,
    });

    // A command spends nothing, so an empty balance does not block it.
    it("accepts a command that spends nothing", () => {
      expect(validateIntent(command(), [])).toEqual({
        errors: {},
        warnings: {},
        estimatedFees: 0n,
        amount: 0n,
        totalSpent: 0n,
      });
    });

    it("reports a command it cannot build", () => {
      const { errors } = validateIntent(command({ valAddress: "0" }), []);

      expect(errors.transaction).toBeInstanceOf(InvalidTransactionError);
    });

    it("reports an invalid dissolve-delay increase", () => {
      const { errors } = validateIntent(
        command({
          type: "increase_dissolve_delay",
          data: { type: "neuron", additionalDissolveDelaySeconds: 0 },
        }),
        [],
      );

      expect(errors.transaction).toBeInstanceOf(ICPInvalidDissolveDelayIncrease);
    });

    it("reports the split amount, which the account does not spend", () => {
      const split = BigInt(MIN_NEURON_STAKE) + FEE;

      expect(validateIntent(command({ type: "split_neuron", amount: split }), [])).toEqual({
        errors: {},
        warnings: {},
        estimatedFees: 0n,
        amount: split,
        totalSpent: 0n,
      });
    });

    it.each([
      ["a split under the minimum", command({ type: "split_neuron", amount: 1n }), "amount"],
      ["a split past Nat64", command({ type: "split_neuron", amount: MAX_NAT64 + 1n }), "amount"],
      ["a partial disburse", command({ type: "disburse", amount: 1n }), "amount"],
      [
        "a disburse to another account",
        command({ type: "disburse", recipient: RECIPIENT }),
        "recipient",
      ],
    ])("reports %s against the %s", (_, input, field) => {
      const { errors } = validateIntent(input, []);

      expect(Object.keys(errors)).toEqual([field]);
    });

    it("reports a split under the minimum as such", () => {
      const { errors } = validateIntent(command({ type: "split_neuron", amount: 1n }), []);

      expect(errors.amount).toBeInstanceOf(NotEnoughTransferAmount);
    });

    it("reports an amount on another command as nothing spent", () => {
      expect(validateIntent(command({ amount: 5n }), []).amount).toBe(0n);
    });

    it("accepts a disburse to the sender's account", () => {
      const { errors } = validateIntent(command({ type: "disburse", recipient: SENDER }), []);

      expect(errors).toEqual({});
    });

    it("reports a fee", () => {
      const { errors } = validateIntent(command(), [], { value: FEE });

      expect(errors.fees).toBeInstanceOf(InvalidTransactionError);
    });

    it("reports an invalid sender", () => {
      const { errors } = validateIntent(command({ sender: "abc" }), []);

      expect(errors.sender).toBeInstanceOf(InvalidAddress);
    });
  });

  // The generic bridge passes `transaction.fees ?? 0` before `prepareTransaction` fills the fee.
  it("accepts a fee not set yet", () => {
    const { errors } = validateIntent(intent(), native(1_000_000n), { value: 0n });

    expect(errors).toEqual({});
  });
});

describe("validateIntent for a stake transfer", () => {
  const PUBKEY =
    "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
  const NONCE = 42n;
  const STAKE = BigInt(MIN_NEURON_STAKE);
  const STAKE_ACCOUNT = getNeuronStakeSubAccountIdentifier(
    derivePrincipalFromPubkey(PUBKEY),
    NONCE,
  );

  const stake = (overrides: Partial<IcpStakingIntent> = {}): IcpStakingIntent => ({
    intentType: "staking",
    type: "create_neuron",
    mode: "delegate",
    valAddress: "rrkah-fqaaa-aaaaa-aaaaq-cai",
    sender: deriveAddressFromPubkey(PUBKEY),
    senderPublicKey: PUBKEY,
    recipient: STAKE_ACCOUNT,
    amount: STAKE,
    asset: { type: "native" },
    data: { type: "neuron", stakeNonce: String(NONCE) },
    ...overrides,
  });

  describe("with the stake account read", () => {
    beforeEach(() => {
      mockFindNeuron.mockResolvedValue(undefined);
      mockLedgerBalance.mockResolvedValue(0n);
    });
    afterEach(() => jest.resetAllMocks());

    it("accepts a stake into an unused account", async () => {
      const { errors } = await validateIntentWithStakeAccount(stake(), native(10n * STAKE));

      expect(errors).toEqual({});
      expect(mockLedgerBalance).toHaveBeenCalledWith(STAKE_ACCOUNT);
    });

    it("reports a stake into an account in use", async () => {
      mockFindNeuron.mockResolvedValue("123");

      const { errors } = await validateIntentWithStakeAccount(stake(), native(10n * STAKE));

      expect(errors.transaction?.message).toMatch(/already in use/);
    });

    // Broadcast does not read the stake account, so validation cannot pass without reading it.
    it("refuses a stake transfer without the sender's public key, reading nothing", async () => {
      const { senderPublicKey: _, ...keyless } = stake();

      const { errors } = await validateIntentWithStakeAccount(keyless, native(10n * STAKE));

      expect(errors.transaction?.message).toMatch(/public key/);
      expect(mockFindNeuron).not.toHaveBeenCalled();
    });

    it("reads nothing for a stake transfer the stateless checks refuse", async () => {
      const { errors } = await validateIntentWithStakeAccount(stake(), native(STAKE));

      expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
      expect(mockFindNeuron).not.toHaveBeenCalled();
    });
  });

  it("accepts a stake the balance covers, with the ledger fee", () => {
    expect(validateIntent(stake(), native(STAKE + FEE))).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: FEE,
      amount: STAKE,
      totalSpent: STAKE + FEE,
    });
  });

  it("stakes the balance net of the fee", () => {
    const result = validateIntent(stake({ useAllAmount: true, amount: 0n }), native(2n * STAKE));

    expect(result.errors).toEqual({});
    expect(result.amount).toBe(2n * STAKE - FEE);
  });

  it("checks the minimum stake against the balance it would send", () => {
    const { errors } = validateIntent(stake({ useAllAmount: true, amount: 0n }), native(STAKE));

    expect(errors.amount).toBeInstanceOf(NotEnoughTransferAmount);
  });

  it("reports a balance that does not cover the stake and the fee", () => {
    const { errors } = validateIntent(stake(), native(STAKE));

    expect(errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it.each([
    ["a stake under the minimum", stake({ amount: STAKE - 1n }), "amount", NotEnoughTransferAmount],
    [
      "a recipient the nonce does not name",
      stake({ recipient: RECIPIENT }),
      "recipient",
      InvalidTransactionError,
    ],
    [
      "a top-up without a nonce",
      stake({ type: "increase_stake", valAddress: "123", data: { type: "neuron" } }),
      "transaction",
      ICPStakeMemoNotRecoverable,
    ],
  ])("reports %s", (_, input, field, error) => {
    const { errors } = validateIntent(input, native(10n * STAKE));

    expect(Object.keys(errors)).toEqual([field]);
    expect(errors[field]).toBeInstanceOf(error);
  });

  it("reports a fee other than the ledger fee", () => {
    const { errors } = validateIntent(stake(), native(10n * STAKE), { value: 1n });

    expect(errors.fees).toBeInstanceOf(InvalidTransactionError);
  });
});
