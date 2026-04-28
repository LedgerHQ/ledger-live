import BigNumber from "bignumber.js";
import {
  accountFixture,
  transactionFixture,
  transactionWithUsdcFeeFixture,
  tokenTransactionWithUsdcFeeFixture,
} from "../../bridge/fixtures";
import getFeesForTransaction from "../../bridge/getFeesForTransaction";

const VALID_RECIPIENT = "0x79D5A290D7ba4b99322d91b577589e8d0BF87072";

const celoGasPriceMock = jest.fn(async () => BigInt(2));
const estimateGasMock = jest.fn(async () => BigInt(3));
const readContractMock = jest.fn(async ({ functionName }: { functionName: string }) => {
  if (functionName === "getAccountNonvotingLockedGold") return BigInt(0);
  if (functionName === "getEligibleValidatorGroupsVotes") return [[], []];
  return BigInt(0);
});

jest.mock("../../network/client", () => ({
  celoGasPrice: (...args: unknown[]) => celoGasPriceMock(...args),
  getCeloClient: jest.fn(() => ({
    estimateGas: (...args: unknown[]) => estimateGasMock(...args),
    estimateMaxPriorityFeePerGas: jest.fn(async () => BigInt(1)),
    getBlock: jest.fn(async () => ({ baseFeePerGas: BigInt(10) })),
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
    return "0x0000000000000000000000000000000000000000";
  }),
}));

jest.mock("../../network/sdk", () => ({
  voteSignerAccount: jest.fn(async () => "signer_account"),
}));

describe("getFeesForTransaction", () => {
  beforeEach(() => {
    celoGasPriceMock.mockClear();
    estimateGasMock.mockReset();
    estimateGasMock.mockImplementation(async () => BigInt(3));
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
