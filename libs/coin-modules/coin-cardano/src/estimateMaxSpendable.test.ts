import BigNumber from "bignumber.js";
import { buildTransaction } from "./buildTransaction";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getCardanoAccountFixture } from "./fixtures/accounts";
import { prepareTransaction } from "./prepareTransaction";

jest.mock("./buildTransaction", () => ({
  buildTransaction: jest.fn(),
}));
jest.mock("./prepareTransaction", () => ({
  prepareTransaction: jest.fn(),
}));

const mockedBuildTransaction = jest.mocked(buildTransaction);
const mockedPrepareTransaction = jest.mocked(prepareTransaction);

describe("estimateMaxSpendable", () => {
  beforeEach(() => {
    mockedBuildTransaction.mockReset();
    mockedPrepareTransaction.mockReset();
  });

  it("returns zero when the account has no UTXOs", async () => {
    const account = getCardanoAccountFixture({ utxos: [] });

    await expect(estimateMaxSpendable({ account })).resolves.toEqual(new BigNumber(0));
  });

  it("returns the full token balance for a token account", async () => {
    const parentAccount = getCardanoAccountFixture({});
    const account = {
      ...parentAccount,
      type: "TokenAccount" as const,
      id: "cardano-testnet-token-1",
      parentId: parentAccount.id,
      balance: new BigNumber(42),
    };

    await expect(estimateMaxSpendable({ account, parentAccount })).resolves.toEqual(
      new BigNumber(42),
    );
  });

  it("returns the outputs sent to the recipient when sending all funds", async () => {
    const account = getCardanoAccountFixture({});
    mockedPrepareTransaction.mockImplementation(async (_, transaction) => transaction);
    mockedBuildTransaction.mockResolvedValue({
      getOutputs: () => [{ address: {}, amount: new BigNumber(99_800_000) }],
    } as never);

    await expect(estimateMaxSpendable({ account })).resolves.toEqual(new BigNumber(99_800_000));
  });

  it("returns zero when the maximum-spendable transaction cannot be built", async () => {
    const account = getCardanoAccountFixture({});
    mockedPrepareTransaction.mockRejectedValue(new Error("network unavailable"));

    await expect(estimateMaxSpendable({ account })).resolves.toEqual(new BigNumber(0));
  });
});
