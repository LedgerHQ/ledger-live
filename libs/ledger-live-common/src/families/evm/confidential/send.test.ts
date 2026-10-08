import BigNumber from "bignumber.js";
import { ethers } from "ethers";
import type { ConfidentialBalance } from "@ledgerhq/coin-evm/confidential";
import {
  AmountRequired,
  InvalidAddress,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/ledger-wallet-framework/errors";
import { setConfidentialSendRuntime } from "./runtime";
import {
  ConfidentialBalanceNotRevealed,
  craftConfidentialTransaction,
  getConfidentialTransactionStatus,
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

const tokenAccount = { type: "TokenAccount", id: "token-1", token: { contractAddress: USDC_MOCK } };
const account = {
  freshAddress: SENDER,
  currency: { id: "ethereum_sepolia" },
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
  setConfidentialSendRuntime({ getBalance: () => balance, prepareSend });
  return { prepareSend };
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
    setConfidentialSendRuntime({ getBalance: () => undefined, prepareSend: jest.fn() });
    await expect(craftConfidentialTransaction(account, send())).rejects.toBeInstanceOf(
      ConfidentialBalanceNotRevealed,
    );
  });
});
