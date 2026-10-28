import { Cbor } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";
import {
  AmountRequired,
  InvalidAddress,
  InvalidTransactionError,
  RecipientRequired,
} from "@ledgerhq/coin-module-framework/errors";
import { MAINNET_GOVERNANCE_CANISTER_ID, MAX_NAT64, MIN_NEURON_STAKE } from "../consts";
import {
  ICPCallUnconfirmed,
  ICPNodeRefused,
  ICPStakeMemoNotRecoverable,
  ICPStakeNotRefreshed,
  ICPTopUpBelowMinimumStake,
  NotEnoughTransferAmount,
} from "../errors";
import {
  claimOrRefreshNeuronFromAccount,
  findNeuronIdBySubaccount,
  queryLedgerBalance,
} from "../network/api";
import {
  getNeuronStakeSubAccount,
  getNeuronStakeSubAccountIdentifier,
} from "./buildNeuronTransaction";
import { createUnsignedTransfer } from "./buildTransaction";
import { craftTransaction } from "./craftTransaction";
import { deriveAddressFromPubkey, derivePrincipalFromPubkey } from "./crypto";
import { errorFieldOf, type IcpStakingIntent } from "./intent";
import {
  checkStakeAccount,
  isStakeTransferIntent,
  parseStakeNonce,
  refreshNeuronStake,
  stakeTransferOf,
} from "./stakeTransfer";

jest.mock("../network/api", () => ({
  ...jest.requireActual("../network/api"),
  claimOrRefreshNeuronFromAccount: jest.fn(),
  findNeuronIdBySubaccount: jest.fn(),
  queryLedgerBalance: jest.fn(),
}));

const mockClaim = jest.mocked(claimOrRefreshNeuronFromAccount);
const mockFindNeuron = jest.mocked(findNeuronIdBySubaccount);
const mockLedgerBalance = jest.mocked(queryLedgerBalance);

const PUBKEY =
  "0484bf7562262bbd6940085748f3be6afa52ae317155181ece31b66351ccffa4b08cc43d63b2859d469fee15f31c9edb5324266e6fd0407e87382d60fc4511acd8";
const SENDER = deriveAddressFromPubkey(PUBKEY);
const CONTROLLER = derivePrincipalFromPubkey(PUBKEY);
const NONCE = 42n;
const STAKE_ACCOUNT = getNeuronStakeSubAccountIdentifier(CONTROLLER, NONCE);
const STAKE = BigInt(MIN_NEURON_STAKE);
const NOW = 1_750_760_220_000;

const stake = (overrides: Record<string, unknown> = {}): IcpStakingIntent =>
  ({
    intentType: "staking",
    type: "create_neuron",
    mode: "delegate",
    valAddress: MAINNET_GOVERNANCE_CANISTER_ID,
    sender: SENDER,
    senderPublicKey: PUBKEY,
    recipient: STAKE_ACCOUNT,
    amount: STAKE,
    asset: { type: "native" },
    data: { type: "neuron", stakeNonce: String(NONCE) },
    ...overrides,
  }) as IcpStakingIntent;

const topUp = (overrides: Record<string, unknown> = {}): IcpStakingIntent =>
  stake({ type: "increase_stake", valAddress: "123", amount: 1n, ...overrides });

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});
afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe("isStakeTransferIntent", () => {
  it.each([
    ["a create_neuron staking intent", stake(), true],
    ["an increase_stake staking intent", topUp(), true],
    ["a neuron command", stake({ type: "start_dissolving" }), false],
    ["a transaction intent", stake({ intentType: "transaction" }), false],
  ])("recognizes %s", (_, intent, expected) => {
    expect(isStakeTransferIntent(intent)).toBe(expected);
  });
});

describe("parseStakeNonce", () => {
  it.each([
    ["0", 0n],
    ["42", 42n],
    [String(MAX_NAT64), MAX_NAT64],
    [String(MAX_NAT64 + 1n), undefined],
    ["-1", undefined],
    ["1.5", undefined],
    ["", undefined],
    [42, undefined],
  ])("reads %p as %p", (text, expected) => {
    expect(parseStakeNonce(text)).toBe(expected);
  });
});

describe("stakeTransferOf", () => {
  it("stakes to the account the nonce names, with the nonce as memo", () => {
    expect(stakeTransferOf(stake())).toEqual({
      recipient: STAKE_ACCOUNT,
      amount: STAKE,
      memo: NONCE,
      nonce: NONCE,
    });
  });

  // A top-up memo of 0 is what history tells it from a stake by.
  it("tops up the neuron it names, with memo 0", () => {
    expect(stakeTransferOf(topUp({ valAddress: "0123" }))).toEqual({
      recipient: STAKE_ACCOUNT,
      amount: 1n,
      memo: 0n,
      nonce: NONCE,
      neuronId: "123",
    });
  });

  it.each([
    [
      "a stake with the memo it would set",
      stake({ memo: { type: "string", kind: "memo", value: String(NONCE) } }),
    ],
    ["a stake with no memo", stake({ memo: { type: "none" } })],
    ["a top-up with no memo", topUp({ memo: { type: "none" } })],
  ])("accepts %s", (_, intent) => {
    expect(stakeTransferOf(intent)).not.toBeInstanceOf(Error);
  });

  // The generic mapping sends `none` when the transaction sets no memo.
  it("crafts a stake whose intent says it sets no memo", () => {
    const { transaction } = craftTransaction(stake({ memo: { type: "none" } }));

    expect(decode(transaction).stake_nonce).toBe(String(NONCE));
  });

  it("accepts a recipient in upper case", () => {
    expect(stakeTransferOf(stake({ recipient: STAKE_ACCOUNT.toUpperCase() }))).toMatchObject({
      recipient: STAKE_ACCOUNT,
    });
  });

  it("checks the amount it is given instead of the intent's", () => {
    expect(stakeTransferOf(stake({ amount: 0n }), STAKE)).toMatchObject({ amount: STAKE });
  });

  // Without the key the stake account cannot be derived; crafting requires the key.
  it("skips the stake-account check without a public key", () => {
    const other = getNeuronStakeSubAccountIdentifier(Principal.anonymous(), NONCE);

    expect(
      stakeTransferOf(stake({ senderPublicKey: undefined, recipient: other })),
    ).not.toBeInstanceOf(Error);
  });

  it.each([
    [
      "a token",
      stake({ asset: { type: "icrc1", assetReference: "x" } }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a create that does not target governance",
      stake({ valAddress: "123" }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a top-up without a neuron id",
      topUp({ valAddress: "abc" }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a create without a nonce",
      stake({ data: undefined }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a top-up without a nonce",
      topUp({ data: { type: "neuron" } }),
      ICPStakeMemoNotRecoverable,
      "transaction",
    ],
    [
      "a nonce that is not a Nat64",
      stake({ data: { type: "neuron", stakeNonce: String(MAX_NAT64 + 1n) } }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a create with nonce 0",
      stake({
        data: { type: "neuron", stakeNonce: "0" },
        recipient: getNeuronStakeSubAccountIdentifier(CONTROLLER, 0n),
      }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a create with another memo",
      stake({ memo: { type: "string", kind: "memo", value: "7" } }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a top-up with a memo",
      topUp({ memo: { type: "string", kind: "memo", value: String(NONCE) } }),
      InvalidTransactionError,
      "transaction",
    ],
    [
      "a memo that is not a string",
      topUp({ memo: { type: "map", memos: new Map([["x", "1"]]) } }),
      InvalidTransactionError,
      "transaction",
    ],
    ["no recipient", stake({ recipient: "" }), RecipientRequired, "recipient"],
    ["an invalid recipient", stake({ recipient: "00" }), InvalidAddress, "recipient"],
    [
      "a recipient the nonce does not name",
      stake({ recipient: getNeuronStakeSubAccountIdentifier(CONTROLLER, NONCE + 1n) }),
      InvalidTransactionError,
      "recipient",
    ],
    ["a stake under the minimum", stake({ amount: STAKE - 1n }), NotEnoughTransferAmount, "amount"],
    ["no top-up amount", topUp({ amount: 0n }), AmountRequired, "amount"],
    ["an amount past Nat64", topUp({ amount: MAX_NAT64 + 1n }), InvalidTransactionError, "amount"],
  ])("refuses %s", (_, intent, error, field) => {
    const transfer = stakeTransferOf(intent);

    expect(transfer).toBeInstanceOf(error);
    expect(errorFieldOf(transfer as Error)).toBe(field);
  });
});

const decode = (hex: string) =>
  Cbor.decode<{ content: Record<string, unknown>; stake_nonce: string }>(Buffer.from(hex, "hex"));

describe("checkStakeAccount", () => {
  const STAKE_SUBACCOUNT = getNeuronStakeSubAccount(CONTROLLER, NONCE);

  const check = (neuronId: string | undefined, amount: bigint) =>
    checkStakeAccount(CONTROLLER, { nonce: NONCE, neuronId, amount });

  const holding = (neuronId: string | undefined, balance: bigint) => {
    mockFindNeuron.mockResolvedValue(neuronId);
    mockLedgerBalance.mockResolvedValue(balance);
  };

  it("reads the stake account the controller and nonce derive", async () => {
    holding(undefined, 0n);

    await check(undefined, STAKE);

    expect(mockFindNeuron).toHaveBeenCalledWith(STAKE_SUBACCOUNT);
    expect(mockLedgerBalance).toHaveBeenCalledWith(STAKE_ACCOUNT);
  });

  it.each([
    ["a create into an unused account", undefined, 0n, undefined, STAKE],
    ["a top-up of the neuron the account holds", "123", STAKE, "123", 1n],
    ["a top-up that brings the neuron to the minimum", "123", STAKE - 5n, "123", 5n],
  ])("accepts %s", async (_, held, balance, neuronId, amount) => {
    holding(held, balance);

    await expect(check(neuronId, amount)).resolves.toBeUndefined();
  });

  it.each([
    ["a create into an account a neuron holds", "123", 0n, undefined, STAKE, "transaction"],
    [
      "a create into an account an unclaimed stake funds",
      undefined,
      1n,
      undefined,
      STAKE,
      "transaction",
    ],
    ["a top-up of another neuron", "456", STAKE, "123", 1n, "transaction"],
    ["a top-up of an account no neuron holds", undefined, STAKE, "123", 1n, "transaction"],
  ])("refuses %s", async (_, held, balance, neuronId, amount, field) => {
    holding(held, balance);

    const refusal = await check(neuronId, amount);

    expect(refusal).toBeInstanceOf(InvalidTransactionError);
    expect(errorFieldOf(refusal as Error)).toBe(field);
  });

  it("refuses a top-up that leaves the neuron under the minimum, with the least top-up", async () => {
    holding("123", STAKE - 50_000_000n);

    const refusal = await check("123", 1n);

    expect(refusal).toBeInstanceOf(ICPTopUpBelowMinimumStake);
    expect(refusal).toMatchObject({ missing: "0.5" });
    expect(errorFieldOf(refusal as Error)).toBe("amount");
  });

  it.each([
    ["the ledger does not answer", () => mockLedgerBalance.mockRejectedValue(new Error("down"))],
    ["governance does not answer", () => mockFindNeuron.mockRejectedValue(new Error("down"))],
  ])("refuses when %s", async (_, arrange) => {
    holding(undefined, 0n);
    arrange();

    await expect(check(undefined, STAKE)).resolves.toBeInstanceOf(InvalidTransactionError);
  });
});

describe("craftStakeTransfer", () => {
  it.each([
    ["a stake", stake(), NONCE],
    ["a top-up", topUp(), 0n],
  ])("crafts %s as the transfer the device signs, beside its nonce", (_, intent, memo) => {
    const { transaction, details } = craftTransaction(intent);
    const { content, stake_nonce } = decode(transaction);
    const { unsignedTransaction } = createUnsignedTransfer(
      { recipient: STAKE_ACCOUNT, amount: intent.amount, memo },
      PUBKEY,
    );

    expect(stake_nonce).toBe(String(NONCE));
    expect(Buffer.from(Cbor.encode({ content }))).toEqual(
      Buffer.from(Cbor.encode({ content: unsignedTransaction })),
    );
    expect(details?.expiresAt).toBe(
      Number(unsignedTransaction.ingress_expiry.toBigInt() / 1_000_000n),
    );
  });

  it("refuses an intent it cannot craft", () => {
    expect(() => craftTransaction(stake({ amount: 1n }))).toThrow(NotEnoughTransferAmount);
  });

  it("refuses a fee other than the ledger fee", () => {
    expect(() => craftTransaction(stake(), { value: 1n })).toThrow(/fee/);
  });

  it("requires the sender's public key", () => {
    expect(() => craftTransaction(stake({ senderPublicKey: undefined }))).toThrow(
      /senderPublicKey/,
    );
  });
});

describe("refreshNeuronStake", () => {
  it.each([
    [
      "governance's refusal",
      new ICPStakeNotRefreshed("busy", { reason: "busy" }),
      ICPStakeNotRefreshed,
    ],
    [
      "a claim the node turned away",
      new ICPNodeRefused("400", { reason: "bad" }),
      ICPStakeNotRefreshed,
    ],
    ["an unknown outcome", new ICPCallUnconfirmed(), ICPCallUnconfirmed],
    ["a failure on the way", new Error("network down"), ICPCallUnconfirmed],
  ])("reports %s as %p", async (_, failure, expected) => {
    mockClaim.mockRejectedValue(failure);

    const error = await refreshNeuronStake(CONTROLLER.toText(), String(NONCE)).catch(e => e);

    expect(error).toBeInstanceOf(expected);
  });

  it("keeps the failure that left the outcome unknown as cause", async () => {
    const failure = new Error("network down");
    mockClaim.mockRejectedValue(failure);

    await expect(refreshNeuronStake(CONTROLLER.toText(), String(NONCE))).rejects.toMatchObject({
      cause: failure,
    });
  });

  it("claims the neuron the controller and nonce name, and returns its id", async () => {
    mockClaim.mockResolvedValue(123n);

    await expect(refreshNeuronStake(CONTROLLER.toText(), String(NONCE))).resolves.toBe("123");
    expect(mockClaim).toHaveBeenCalledWith(CONTROLLER, NONCE);
  });

  it("reports a claim no answer settles as unconfirmed", async () => {
    mockClaim.mockResolvedValue(undefined);

    await expect(refreshNeuronStake(CONTROLLER.toText(), String(NONCE))).rejects.toBeInstanceOf(
      ICPCallUnconfirmed,
    );
  });

  it("refuses a nonce that is not a Nat64", async () => {
    await expect(refreshNeuronStake(CONTROLLER.toText(), "x")).rejects.toThrow(/stake nonce/);
    expect(mockClaim).not.toHaveBeenCalled();
  });
});
