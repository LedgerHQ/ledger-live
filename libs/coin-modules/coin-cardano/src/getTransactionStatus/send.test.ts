import { BigNumber } from "bignumber.js";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import { getCardanoAccountFixture } from "../fixtures/accounts";
import { buildTransaction } from "../buildTransaction";
import type { Transaction } from "../types";
import { getSendTransactionStatus } from "./send";

jest.mock("../buildTransaction", () => ({
  buildTransaction: jest.fn(),
}));

const mockedBuildTransaction = jest.mocked(buildTransaction);

const buildTransactionInput = (): Transaction => ({
  family: "cardano",
  recipient:
    "addr_test1qz7jw975stagnvs00wsjny6y6gpazn86yvwcm2vy02j3up7mt68vuzvz4nzgs00x0shrgywvy674v6r2zcs8fxvvq27qfjq8np",
  amount: new BigNumber(2e6),
  fees: new BigNumber(170_000),
  mode: "send",
  poolId: undefined,
  protocolParams: getProtocolParamsFixture(),
});

describe("getSendTransactionStatus", () => {
  let account: ReturnType<typeof getCardanoAccountFixture>;

  beforeEach(() => {
    mockedBuildTransaction.mockReset();
    account = getCardanoAccountFixture({});
    account.balance = new BigNumber(100e6);
    account.spendableBalance = new BigNumber(100e6);
    account.cardanoResources.protocolParams = getProtocolParamsFixture();
  });

  it.each([
    ["Not enough ADA"],
    ["Not enough tokens"],
    ["Tx size limit reached, try spending lesser ADA/Tokens"],
  ])("maps the build error %p to an amount error instead of re-throwing", async message => {
    mockedBuildTransaction.mockRejectedValueOnce(new Error(message));

    const status = await getSendTransactionStatus(account, buildTransactionInput());

    expect(status.errors.amount?.name).toBe("CardanoNotEnoughFunds");
  });

  it("re-throws unexpected build errors", async () => {
    mockedBuildTransaction.mockRejectedValueOnce(new Error("Unexpected programming error"));

    await expect(getSendTransactionStatus(account, buildTransactionInput())).rejects.toThrow(
      "Unexpected programming error",
    );
  });
});
