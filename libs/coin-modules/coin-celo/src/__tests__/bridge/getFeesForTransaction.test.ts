import BigNumber from "bignumber.js";
import {
  MAX_FEES_THRESHOLD_MULTIPLIER,
  MIN_GAS_FOR_NATIVE_TRANSFER,
  ZERO_ADDRESS,
} from "../../constants";
import {
  accountWithTokenAccountFixture,
  accountFixture,
  transactionFixture,
  transactionWithUsdcFeeFixture,
  tokenTransactionWithUsdcFeeFixture,
} from "../../bridge/fixtures";
import getFeesForTransaction from "../../bridge/getFeesForTransaction";

const VALID_RECIPIENT = "0x79D5A290D7ba4b99322d91b577589e8d0BF87072";

const celoGasPriceMock = jest.fn(async (..._args: unknown[]) => BigInt(2));
const estimateGasMock = jest.fn(async (..._args: unknown[]) => BigInt(3));
const estimateMaxPriorityFeePerGasMock = jest.fn(async (..._args: unknown[]) => BigInt(1));
const getBlockMock = jest.fn<Promise<{ baseFeePerGas: bigint | undefined }>, unknown[]>(
  async () => ({ baseFeePerGas: BigInt(10) }),
);
const readContractMock = jest.fn(async ({ functionName }: { functionName: string }) => {
  if (functionName === "getAccountNonvotingLockedGold") return BigInt(0);
  if (functionName === "getTotalVotesForEligibleValidatorGroups") return [[], []];
  return BigInt(0);
});

jest.mock("../../network/client", () => ({
  celoGasPrice: (...args: unknown[]) => celoGasPriceMock(...args),
  getCeloClient: jest.fn(() => ({
    estimateGas: (...args: unknown[]) => estimateGasMock(...args),
    estimateMaxPriorityFeePerGas: (...args: unknown[]) => estimateMaxPriorityFeePerGasMock(...args),
    getBlock: (...args: unknown[]) => getBlockMock(...args),
    getChainId: jest.fn(async () => 42220),
    getTransactionCount: jest.fn(async () => 1),
    readContract: readContractMock,
  })),
}));

jest.mock("../../network/registry", () => ({
  getRegistryAddressFor: jest.fn(async (name: string) => {
    if (name === "LockedGold") return "0x0000000000000000000000000000000000001d00";
    if (name === "Election") return "0x000000000000000000000000000000000000ce10";
    if (name === "Accounts") return "0x000000000000000000000000000000000000aa10";
    return ZERO_ADDRESS;
  }),
}));

jest.mock("../../network/sdk", () => ({
  voteSignerAccount: jest.fn(async () => "signer_account"),
}));

describe("getFeesForTransaction", () => {
  beforeEach(() => {
    celoGasPriceMock.mockClear();
    celoGasPriceMock.mockImplementation(async () => BigInt(2));
    estimateGasMock.mockReset();
    estimateGasMock.mockImplementation(async () => BigInt(3));
    estimateMaxPriorityFeePerGasMock.mockReset();
    estimateMaxPriorityFeePerGasMock.mockImplementation(async () => BigInt(1));
    getBlockMock.mockReset();
    getBlockMock.mockImplementation(async () => ({ baseFeePerGas: BigInt(10) }));
  });

  it("should return the correct fees for a send transaction", async () => {
    // buildTransaction is called for send, estimateGas returns 3, *4 = 12, fees = 2*12 = 24
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, recipient: VALID_RECIPIENT },
    });

    expect(fees).toEqual(BigNumber(24));
  });

  it("should return the correct fees for a revoke transaction without revoked transactions", async () => {
    // estimateGas throws for revoke with 0 votes → return 0
    estimateGasMock.mockImplementation(async () => {
      throw new Error("execution reverted");
    });

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "revoke", recipient: VALID_RECIPIENT },
    });

    expect(fees).toEqual(BigNumber(0));
  });

  it("should return the correct fees for a revoke transaction with revoked transactions", async () => {
    // estimateGas = 2, fees = 2*2 = 4
    estimateGasMock.mockImplementation(async () => BigInt(2));

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "revoke", recipient: VALID_RECIPIENT },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return the correct fees for a revoke transaction with revoked transactions and useAllAmount set to true", async () => {
    estimateGasMock.mockImplementation(async () => BigInt(2));

    const fees = await getFeesForTransaction({
      account: {
        ...accountFixture,
        balance: BigNumber(123),
        spendableBalance: BigNumber(123),
        celoResources: {
          ...accountFixture.celoResources,
          votes: [
            {
              activatable: true,
              amount: BigNumber(10),
              index: 0,
              revokable: true,
              type: "active" as const,
              validatorGroup: VALID_RECIPIENT,
            },
          ],
        },
      },
      transaction: {
        ...transactionFixture,
        mode: "revoke",
        useAllAmount: true,
        recipient: VALID_RECIPIENT,
      },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return the correct fees for a withdraw transaction", async () => {
    // estimateGas = 3, fees = 2*3 = 6
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "withdraw" },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return the correct fees for a vote transaction", async () => {
    // estimateGas = 1, fees = 2*1 = 2
    estimateGasMock.mockImplementation(async () => BigInt(1));

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "vote", recipient: VALID_RECIPIENT },
    });

    expect(fees).toEqual(BigNumber(2));
  });

  it("should fallback to min native transfer gas when vote estimateGas fails", async () => {
    estimateGasMock.mockImplementation(async () => {
      throw new Error("execution reverted");
    });

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "vote", recipient: VALID_RECIPIENT },
    });

    const expectedGas = MIN_GAS_FOR_NATIVE_TRANSFER * MAX_FEES_THRESHOLD_MULTIPLIER;
    const expectedFee = new BigNumber(2).times(expectedGas);
    expect(fees).toEqual(expectedFee);
  });

  it("should return the correct fees for a lock transaction", async () => {
    // estimateGas = 2, fees = 2*2 = 4
    estimateGasMock.mockImplementation(async () => BigInt(2));

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "lock" },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return fees for lock when amount is NaN (valueToHex returns 0x0)", async () => {
    estimateGasMock.mockImplementation(async () => BigInt(2));

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "lock", amount: new BigNumber(NaN) },
    });

    expect(fees).toEqual(BigNumber(4));
  });

  it("should return the correct fees for a unlock transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "unlock" },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return the correct fees for an activate transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "activate", recipient: VALID_RECIPIENT },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return the correct fees for a register transaction", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "register" },
    });

    expect(fees).toEqual(BigNumber(6));
  });

  it("should return fees for send when amount is less than 1 CELO but greater than gas fee", async () => {
    const oneCelo = new BigNumber(10).pow(18);
    const pointOneCelo = new BigNumber(10).pow(17);

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: oneCelo, spendableBalance: oneCelo },
      transaction: { ...transactionFixture, mode: "send", amount: pointOneCelo },
    });

    expect(fees).toBeInstanceOf(BigNumber);
    expect(fees.gt(0)).toBe(true);
    expect(fees.lt(pointOneCelo)).toBe(true);
  });

  it("should return the correct fees for a send transaction with USDC fee currency", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: transactionWithUsdcFeeFixture,
    });

    expect(fees).toBeInstanceOf(BigNumber);
    expect(fees.gt(0)).toBe(true);
  });

  it("should return the correct fees for a token transaction with USDC fee currency", async () => {
    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: tokenTransactionWithUsdcFeeFixture,
    });

    expect(fees).toBeInstanceOf(BigNumber);
    expect(fees.gt(0)).toBe(true);
  });

  it("should fallback to maxPriorityFeePerGas when latest block baseFeePerGas is undefined", async () => {
    getBlockMock.mockImplementation(async () => ({ baseFeePerGas: undefined }));

    await getFeesForTransaction({
      account: {
        ...accountWithTokenAccountFixture,
        balance: BigNumber(123),
        spendableBalance: BigNumber(123),
      },
      transaction: {
        ...tokenTransactionWithUsdcFeeFixture,
        recipient: VALID_RECIPIENT,
      },
    });

    expect(estimateGasMock).toHaveBeenCalledWith(
      expect.objectContaining({
        maxPriorityFeePerGas: BigInt(1),
        maxFeePerGas: BigInt(2),
      }),
    );
  });

  it("should apply the fee market gas formula when computing final fees", async () => {
    celoGasPriceMock.mockImplementation(async () => BigInt(11));
    estimateMaxPriorityFeePerGasMock.mockImplementation(async () => BigInt(1));
    estimateGasMock.mockImplementation(async () => BigInt(2));

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "lock", recipient: VALID_RECIPIENT },
    });

    // maxFeePerGas = ((11 - 1) * 120 / 100) + 1 = 13
    expect(fees).toEqual(BigNumber(26));
  });

  it("should floor fee market baseFeePerGas at 0 when gasPrice is lower than priority fee", async () => {
    celoGasPriceMock.mockImplementation(async () => BigInt(1));
    estimateMaxPriorityFeePerGasMock.mockImplementation(async () => BigInt(100));
    estimateGasMock.mockImplementation(async () => BigInt(2));

    const fees = await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: { ...transactionFixture, mode: "lock", recipient: VALID_RECIPIENT },
    });

    // baseFeePerGas is floored to 0, so maxFeePerGas = 100.
    expect(fees).toEqual(BigNumber(200));
  });

  it("should pass feeCurrency parameter to gasPrice when provided", async () => {
    celoGasPriceMock.mockClear();

    await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction: transactionWithUsdcFeeFixture,
    });

    expect(celoGasPriceMock).toHaveBeenCalledWith(transactionWithUsdcFeeFixture.feeCurrency);
  });

  it("should call gasPrice with adapter feeCurrency when adapter/unwrapped differ", async () => {
    celoGasPriceMock.mockClear();

    const transaction = {
      ...transactionWithUsdcFeeFixture,
      feeCurrency: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as `0x${string}`,
      feeCurrencyUnwrapped: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as `0x${string}`,
    };

    await getFeesForTransaction({
      account: { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      transaction,
    });

    expect(celoGasPriceMock).toHaveBeenCalledWith(transaction.feeCurrency);
  });
});
