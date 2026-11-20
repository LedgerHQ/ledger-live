import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { fetchPoxInfo } from "@ledgerhq/coin-stacks/network/pox";
import { genericGetTransactionStatus } from "../../../bridge/generic-coin-framework/getTransactionStatus";
import type { StacksAccount, Transaction } from "../types";

jest.mock("@ledgerhq/coin-stacks/network/pox");

const SENDER = "SP26AZ1JSFZQ82VH5W2NJSB2QW15EW5YKT6WMD69J";
const RECIPIENT = "SPNX9YY3T4GR4XDSNRVWB2MDQVCTJMP3BGT7VCZA";
const CONTRACT = "SP3BRXZ9Y7P5YP28PSR8YJT39RT51ZZBSECTCADGR.skullcoin-stxcity::SKULL";
const FEE = new BigNumber(180);

const tokenAccount = {
  type: "TokenAccount",
  id: "sub1",
  token: { id: "stacks/sip010/skull", contractAddress: CONTRACT, tokenType: "sip010" },
  balance: new BigNumber(1000),
  spendableBalance: new BigNumber(1000),
  pendingOperations: [],
  operations: [],
};

const account = {
  ...genAccount("stacks-transfer-status", { currency: getCryptoCurrencyById("stacks") }),
  freshAddress: SENDER,
  balance: new BigNumber(10_000_000),
  spendableBalance: new BigNumber(10_000_000),
  pendingOperations: [],
  subAccounts: [tokenAccount],
} as unknown as StacksAccount;

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  ({
    family: "stacks",
    amount: new BigNumber(1),
    recipient: RECIPIENT,
    network: "mainnet",
    anchorMode: 3,
    fee: FEE,
    fees: FEE,
    ...overrides,
  }) as Transaction;

const makeTokenTransaction = (overrides: Partial<Transaction> = {}): Transaction =>
  makeTransaction({
    subAccountId: tokenAccount.id,
    assetReference: CONTRACT,
    assetOwner: SENDER,
    amount: new BigNumber(10),
    ...overrides,
  } as Partial<Transaction>);

const genericStatus = genericGetTransactionStatus("stacks", "local");

describe("Stacks transfer transactions on the generic bridge", () => {
  beforeEach(() => {
    jest.mocked(fetchPoxInfo).mockResolvedValue({
      next_cycle: { blocks_until_prepare_phase: 300, blocks_until_reward_phase: 400 },
    } as Awaited<ReturnType<typeof fetchPoxInfo>>);
  });

  it("returns no errors and the amount plus fees as total spent for a valid STX transfer", async () => {
    const status = await genericStatus(account, makeTransaction());

    expect(status.errors).toEqual({});
    expect(status.amount).toEqual(new BigNumber(1));
    expect(status.totalSpent).toEqual(new BigNumber(181));
  });

  it("flags a recipient equal to the sender", async () => {
    const status = await genericStatus(account, makeTransaction({ recipient: SENDER }));

    expect(status.errors.recipient?.name).toEqual("InvalidAddressBecauseDestinationIsAlsoSource");
  });

  it("returns RecipientRequired and AmountRequired for an empty transaction", async () => {
    const status = await genericStatus(
      account,
      makeTransaction({ recipient: "", amount: new BigNumber(0) }),
    );

    expect(status.errors.recipient?.name).toEqual("RecipientRequired");
    expect(status.errors.amount?.name).toEqual("AmountRequired");
  });

  it("flags a token transfer above the sub account balance", async () => {
    const status = await genericStatus(
      account,
      makeTokenTransaction({ amount: new BigNumber("10000000000000000") }),
    );

    expect(status.errors.amount?.name).toEqual("NotEnoughBalance");
  });

  it("validates a token transfer within the sub account balance", async () => {
    const status = await genericStatus(account, makeTokenTransaction());

    expect(status.errors).toEqual({});
    expect(status.amount).toEqual(new BigNumber(10));
    expect(status.totalSpent).toEqual(new BigNumber(10));
  });

  it("resolves a token useAllAmount to the sub account spendable balance", async () => {
    const status = await genericStatus(
      account,
      makeTokenTransaction({ useAllAmount: true, amount: new BigNumber(0) }),
    );

    expect(status.amount).toEqual(new BigNumber(1000));
  });
});
