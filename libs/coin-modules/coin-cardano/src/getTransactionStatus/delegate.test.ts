import BigNumber from "bignumber.js";
import { buildTransaction } from "../buildTransaction";
import { CardanoInvalidPoolId } from "../errors";
import { getCardanoAccountFixture } from "../fixtures/accounts";
import { getProtocolParamsFixture } from "../fixtures/protocolParams";
import type { Transaction } from "../types";
import { getDelegateTransactionStatus } from "./delegate";

jest.mock("../buildTransaction", () => ({
  buildTransaction: jest.fn(),
}));

const mockedBuildTransaction = jest.mocked(buildTransaction);

const delegateTransaction = (poolId: string): Transaction => ({
  family: "cardano",
  mode: "delegate",
  recipient: "",
  amount: new BigNumber(0),
  fees: new BigNumber(170_000),
  poolId,
});

describe("getDelegateTransactionStatus", () => {
  beforeEach(() => {
    mockedBuildTransaction.mockReset();
  });

  it("returns a pool ID error for an invalid pool ID", async () => {
    const account = getCardanoAccountFixture({});
    account.cardanoResources.protocolParams = getProtocolParamsFixture();

    const status = await getDelegateTransactionStatus(account, delegateTransaction("invalid"));

    expect(status.errors.poolId).toBeInstanceOf(CardanoInvalidPoolId);
    expect(mockedBuildTransaction).not.toHaveBeenCalled();
  });

  it("accepts a 56-character hexadecimal pool ID", async () => {
    const account = getCardanoAccountFixture({ delegation: { status: true } });
    account.cardanoResources.protocolParams = getProtocolParamsFixture();
    mockedBuildTransaction.mockResolvedValue({} as never);
    const transaction = delegateTransaction(
      "efae72c07a26e4542ba55ef59d35ad45ffaaac312865e3a758ede997",
    );

    const status = await getDelegateTransactionStatus(account, transaction);

    expect(status.errors).toEqual({});
    expect(mockedBuildTransaction).toHaveBeenCalledWith(account, transaction);
  });
});
