import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import type { ConfidentialBalance } from "@ledgerhq/coin-evm/confidential";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
  NotEnoughGas,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { setConfidentialSendRuntime } from "./runtime";
import {
  ConfidentialBalanceNotRevealed,
  craftConfidentialTransaction,
  getConfidentialTransactionStatus,
  onConfidentialTransactionSigned,
} from "./send";

const USDC_MOCK = "0x9b5Cd13b8eFbB58Dc25A05CF411D8056058aDFfF";
const CUSDC_MOCK = "0x7c5BF43B851c1dff1a4feE8dB225b87f2C223639";
const SENDER = "0x0a101aA5347Bb16F43019BE42ce5830395739e33";
const RECIPIENT = "0xC7c878cC3D9B955Cbd96D0579E651fb2F1553073";
const HANDLE = `0x${"ab".repeat(32)}` as const;
const PAIR = { underlying: USDC_MOCK, wrapper: CUSDC_MOCK, rate: 1n, wrapperDecimals: 6 };

const decrypted: ConfidentialBalance = {
  state: "decrypted",
  pair: PAIR,
  handle: HANDLE,
  value: 2_500_000n,
  underlyingValue: 2_500_000n,
  updatedAt: 0,
};

const tokenAccount = {
  type: "TokenAccount",
  id: "token-1",
  token: { contractAddress: USDC_MOCK },
  spendableBalance: new BigNumber(75_000_000),
};
const account = {
  freshAddress: SENDER,
  spendableBalance: new BigNumber("100000000000000000"),
  currency: {
    id: "ethereum_sepolia",
    name: "Ethereum Sepolia",
    ticker: "ETH",
    units: [{ name: "ether", code: "ETH", magnitude: 18 }],
  },
  subAccounts: [tokenAccount],
} as any;

const unsigned = ethers.Transaction.from({
  type: 2,
  chainId: 11155111n,
  nonce: 16,
  to: CUSDC_MOCK,
  data: "0x2fb74e62",
  gasLimit: 600_000n,
  maxFeePerGas: 2n,
  maxPriorityFeePerGas: 1n,
}).unsignedSerialized;

const craftAt = (nonce: number, to: string) =>
  ethers.Transaction.from({
    type: 2,
    chainId: 11155111n,
    nonce,
    to,
    data: "0x",
    gasLimit: 100_000n,
    maxFeePerGas: 2n,
    maxPriorityFeePerGas: 1n,
  }).unsignedSerialized;
const approveUnsigned = craftAt(20, USDC_MOCK);
const wrapUnsigned = craftAt(21, CUSDC_MOCK);

const send = (fields: Record<string, unknown> = {}) => ({
  subAccountId: "token-1",
  recipient: RECIPIENT,
  amount: new BigNumber(1_000_000),
  fees: new BigNumber(42),
  familySpecificData: { balanceType: "confidential" },
  ...fields,
});

function setup(balance: ConfidentialBalance | undefined = decrypted) {
  const prepareSend = jest.fn().mockResolvedValue({
    transaction: unsigned,
    handle: HANDLE,
    amount: 1_000_000n,
    underlyingAmount: 1_000_000n,
  });
  const prepareUnshield = jest.fn().mockResolvedValue({
    transaction: unsigned,
    handle: HANDLE,
    amount: 1_000_000n,
    underlyingAmount: 1_000_000n,
  });
  const onUnshieldRequested = jest.fn();
  const prepareShield = jest.fn().mockResolvedValue({
    transactions: [{ transaction: approveUnsigned }, { transaction: wrapUnsigned }],
    amountPulled: 1_000_000n,
    remainder: 0n,
  });
  setConfidentialSendRuntime({
    getBalance: () => balance,
    getOwner: () => SENDER,
    prepareSend,
    prepareShield,
    prepareUnshield,
    onUnshieldRequested,
  });
  return { prepareSend, prepareShield, prepareUnshield, onUnshieldRequested };
}

afterEach(() => setConfidentialSendRuntime(undefined));

describe("getConfidentialTransactionStatus", () => {
  it("leaves a public send to the generic validation", async () => {
    setup();
    expect(
      await getConfidentialTransactionStatus(account, send({ familySpecificData: undefined })),
    ).toBeUndefined();
    expect(
      await getConfidentialTransactionStatus(
        account,
        send({ familySpecificData: { balanceType: "public" } }),
      ),
    ).toBeUndefined();
  });

  it("accepts an amount the revealed private balance covers, beyond the public balance", async () => {
    setup();
    const status = await getConfidentialTransactionStatus(account, send());
    expect(status).toEqual({
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber(42),
      amount: new BigNumber(1_000_000),
      totalSpent: new BigNumber(1_000_000),
    });
  });

  it("sends the whole private balance with max", async () => {
    setup();
    const status = await getConfidentialTransactionStatus(account, send({ useAllAmount: true }));
    expect(status?.amount).toEqual(new BigNumber(2_500_000));
  });

  it.each([
    [
      "more than the private balance",
      send({ amount: new BigNumber(2_500_001) }),
      "amount",
      NotEnoughBalance,
    ],
    ["no amount", send({ amount: new BigNumber(0) }), "amount", AmountRequired],
    ["no recipient", send({ recipient: "" }), "recipient", RecipientRequired],
    ["an invalid recipient", send({ recipient: "0x1234" }), "recipient", InvalidAddress],
  ])("reports %s", async (_label, transaction, field, ErrorClass) => {
    setup();
    const status = await getConfidentialTransactionStatus(account, transaction);
    expect(status?.errors[field]).toBeInstanceOf(ErrorClass);
  });

  it("refuses a private balance that was never revealed", async () => {
    setup({ state: "undisclosed", pair: PAIR, handle: HANDLE });
    const status = await getConfidentialTransactionStatus(account, send());
    expect(status?.errors.amount).toBeInstanceOf(ConfidentialBalanceNotRevealed);
  });
});

describe("craftConfidentialTransaction", () => {
  it("prepares the transfer through the host and numbers it with its nonce", async () => {
    const { prepareSend } = setup();
    const crafted = await craftConfidentialTransaction(account, send());
    expect(prepareSend).toHaveBeenCalledWith("ethereum_sepolia", {
      sender: SENDER,
      recipient: RECIPIENT,
      underlying: USDC_MOCK,
      amount: 1_000_000n,
      balance: decrypted,
    });
    expect(crafted).toEqual({ transaction: unsigned, sequence: 16n });
  });

  it("crafts nothing for a public send", async () => {
    const { prepareSend } = setup();
    expect(
      await craftConfidentialTransaction(account, send({ familySpecificData: undefined })),
    ).toBeUndefined();
    expect(prepareSend).not.toHaveBeenCalled();
  });

  it("refuses without a revealed private balance", async () => {
    setConfidentialSendRuntime({
      getBalance: () => undefined,
      getOwner: () => undefined,
      prepareSend: jest.fn(),
      prepareShield: jest.fn(),
      prepareUnshield: jest.fn(),
      onUnshieldRequested: jest.fn(),
    });
    await expect(craftConfidentialTransaction(account, send())).rejects.toBeInstanceOf(
      ConfidentialBalanceNotRevealed,
    );
  });
});

describe("unshield (confidential self-transfer)", () => {
  const unshield = (fields: Record<string, unknown> = {}) =>
    send({ selfTransfer: true, recipient: SENDER, ...fields });

  it("prepares an unwrap to the sender's own public part", async () => {
    const { prepareSend, prepareUnshield } = setup();
    const crafted = await craftConfidentialTransaction(account, unshield());
    expect(prepareSend).not.toHaveBeenCalled();
    expect(prepareUnshield).toHaveBeenCalledWith("ethereum_sepolia", {
      sender: SENDER,
      recipient: SENDER,
      underlying: USDC_MOCK,
      amount: 1_000_000n,
      balance: decrypted,
    });
    expect(crafted).toEqual({ transaction: unsigned, sequence: 16n });
  });

  it("validates against the private balance whatever the recipient field holds", async () => {
    setup();
    const status = await getConfidentialTransactionStatus(account, unshield({ recipient: "" }));
    expect(status?.errors).toEqual({});
  });

  it("hands the signed request to the host with its hash and wrapper amount", async () => {
    const { onUnshieldRequested } = setup();
    const transaction = unshield();
    await craftConfidentialTransaction(account, transaction);
    const signed = ethers.Transaction.from(unsigned);
    signed.signature = ethers.Signature.from({
      r: `0x${"11".repeat(32)}`,
      s: `0x${"22".repeat(32)}`,
      v: 27,
    });

    onConfidentialTransactionSigned(account, transaction, signed.serialized);

    expect(onUnshieldRequested).toHaveBeenCalledWith("token-1", {
      requestTxHash: signed.hash,
      amount: 1_000_000n,
    });
  });

  it("reports nothing for a confidential send to someone else", async () => {
    const { onUnshieldRequested } = setup();
    const transaction = send();
    await craftConfidentialTransaction(account, transaction);
    const signed = ethers.Transaction.from(unsigned);
    signed.signature = ethers.Signature.from({
      r: `0x${"11".repeat(32)}`,
      s: `0x${"22".repeat(32)}`,
      v: 27,
    });

    onConfidentialTransactionSigned(account, transaction, signed.serialized);

    expect(onUnshieldRequested).not.toHaveBeenCalled();
  });
});

describe("shield (public self-transfer)", () => {
  const shield = (fields: Record<string, unknown> = {}) =>
    send({
      selfTransfer: true,
      recipient: SENDER,
      familySpecificData: { balanceType: "public" },
      ...fields,
    });
  const undisclosed: ConfidentialBalance = { state: "undisclosed", pair: PAIR, handle: HANDLE };

  it("signs approve first, then the wrap the operation stands for", async () => {
    const { prepareShield, prepareSend } = setup(undisclosed);
    const crafted = await craftConfidentialTransaction(account, shield());
    expect(prepareSend).not.toHaveBeenCalled();
    expect(prepareShield).toHaveBeenCalledWith("ethereum_sepolia", {
      sender: SENDER,
      underlying: USDC_MOCK,
      amount: 1_000_000n,
    });
    expect(crafted).toEqual({
      transaction: wrapUnsigned,
      sequence: 21n,
      prerequisites: [approveUnsigned],
    });
  });

  it("signs the wrap alone when the allowance already covers the amount", async () => {
    const { prepareShield } = setup(undisclosed);
    prepareShield.mockResolvedValueOnce({
      transactions: [null, { transaction: wrapUnsigned }],
      amountPulled: 1_000_000n,
      remainder: 0n,
    });
    const crafted = await craftConfidentialTransaction(account, shield());
    expect(crafted?.prerequisites).toEqual([]);
  });

  it("validates the amount against the public balance, revealed or not", async () => {
    setup(undisclosed);
    expect((await getConfidentialTransactionStatus(account, shield()))?.errors).toEqual({});
    const tooMuch = await getConfidentialTransactionStatus(
      account,
      shield({ amount: new BigNumber(75_000_001) }),
    );
    expect(tooMuch?.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("leaves a plain public send to the generic path", async () => {
    setup(undisclosed);
    const plain = send({ familySpecificData: { balanceType: "public" } });
    expect(await craftConfidentialTransaction(account, plain)).toBeUndefined();
    expect(await getConfidentialTransactionStatus(account, plain)).toBeUndefined();
  });
});

describe("network fees", () => {
  it("asks for ETH when the account cannot pay the fees of a shield or a confidential send", async () => {
    setup();
    const broke = { ...account, spendableBalance: new BigNumber(0) };
    const shieldStatus = await getConfidentialTransactionStatus(
      broke,
      send({ selfTransfer: true, familySpecificData: { balanceType: "public" } }),
    );
    expect(shieldStatus?.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
    expect(shieldStatus?.errors.amount).toBeUndefined();
    const sendStatus = await getConfidentialTransactionStatus(broke, send());
    expect(sendStatus?.errors.gasPrice).toBeInstanceOf(NotEnoughGas);
  });
});
