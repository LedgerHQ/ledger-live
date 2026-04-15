import BigNumber from "bignumber.js";
import {
  accountFixture,
  accountWithTokenAccountFixture,
  transactionFixture,
  tokenTransactionFixture,
  transactionWithUsdcFeeFixture,
  tokenTransactionWithUsdcFeeFixture,
  usdcTokenAccount,
} from "../../bridge/fixtures";
import getTransactionStatus from "../../bridge/getTransactionStatus";

jest.mock("../../network/sdk", () => {
  return {
    celoKit: jest.fn(() => ({
      contracts: {
        getLockedGold: jest.fn(async () => ({
          address: "address",
          lock: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "lock_data" })),
              estimateGas: jest.fn(async () => 2),
            },
          })),
          unlock: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "unlock_data" })),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          withdraw: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "withdraw_data" })),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          vote: jest.fn(() => ({
            txo: {
              encodeABI: jest.fn(() => ({ data: "vote_data" })),
              estimateGas: jest.fn(async () => 3),
            },
          })),
          getAccountNonvotingLockedGold: jest.fn(() => BigNumber(100)),
        })),
      },
    })),
  };
});

describe("getTransactionStatus", () => {
  it("should return an InvalidAddressBecauseDestinationIsAlsoSource error in case the recipient is also the sender", async () => {
    const transactionStatus = await getTransactionStatus(
      { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        recipient: accountFixture.freshAddress,
        fees: BigNumber(2),
      },
    );

    expect(transactionStatus.errors["recipient"].name).toEqual(
      "InvalidAddressBecauseDestinationIsAlsoSource",
    );
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return an FeeNotLoaded error in case the transaction is missing fees", async () => {
    const transactionStatus = await getTransactionStatus(
      { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      },
    );

    expect(transactionStatus.errors["fees"].name).toEqual("FeeNotLoaded");
    expect(transactionStatus.errors).not.toHaveProperty("recipient");
    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return NotEnoughBalance for send when totalSpent exceeds totalSpendableBalance", async () => {
    const transactionStatus = await getTransactionStatus(
      { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        mode: "send",
        fees: BigNumber(2),
        amount: BigNumber(88888),
      },
    );

    expect(transactionStatus.errors["amount"].name).toEqual("NotEnoughBalance");
    expect(transactionStatus.errors).not.toHaveProperty("recipient");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return NotEnoughBalance for send when totalSpendableBalance is below estimated fees", async () => {
    const balanceBelowFees = new BigNumber(10);
    const estimatedFees = new BigNumber(24);

    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: balanceBelowFees,
        spendableBalance: balanceBelowFees,
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        mode: "send",
        useAllAmount: true,
        fees: estimatedFees,
      },
    );

    expect(transactionStatus.errors["amount"].name).toEqual("NotEnoughBalance");
  });

  it("should return an RecipientRequired error in case the transaction does not have a recipient address", async () => {
    const transactionStatus = await getTransactionStatus(
      { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        recipient: "",
        fees: BigNumber(2),
      },
    );

    expect(transactionStatus.errors["recipient"].name).toEqual("RecipientRequired");
    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return an InvalidAddress error in case the transaction does not have a valid recipient address", async () => {
    const transactionStatus = await getTransactionStatus(
      { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        fees: BigNumber(2),
      },
    );

    expect(transactionStatus.errors["recipient"].name).toEqual("InvalidAddress");
    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return a CeloAllFundsWarning warning in case of a send or lock transaction is using all the balance above the safety buffer", async () => {
    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: BigNumber(10000000000000000),
        spendableBalance: BigNumber(10000000000000000),
        celoResources: {
          ...accountFixture.celoResources,
          lockedBalance: BigNumber(44444),
        },
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(9000000000000000),
        fees: BigNumber(2),
      },
    );

    expect(transactionStatus.warnings["amount"].name).toEqual("CeloAllFundsWarning");
    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(transactionStatus.errors).not.toHaveProperty("recipient");
  });

  it("should not return any error or warning", async () => {
    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: BigNumber(10000000000000000),
        spendableBalance: BigNumber(10000000000000000),
        celoResources: {
          ...accountFixture.celoResources,
          lockedBalance: BigNumber(44444),
        },
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        fees: BigNumber(2),
        useAllAmount: true,
        mode: "vote",
      },
    );

    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(transactionStatus.errors).not.toHaveProperty("recipient");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return an AmountRequired error", async () => {
    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: BigNumber(10000000000000000),
        spendableBalance: BigNumber(10000000000000000),
        celoResources: {
          ...accountFixture.celoResources,
          lockedBalance: BigNumber(44444),
        },
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        fees: BigNumber(2),
        amount: BigNumber(0),
      },
    );

    expect(transactionStatus.errors["amount"].name).toEqual("AmountRequired");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(transactionStatus.errors).not.toHaveProperty("recipient");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return an NotEnoughBalance error for a vote transaction where the amount is higher than the total non-voting locked balance", async () => {
    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: BigNumber(10000000000000000),
        spendableBalance: BigNumber(10000000000000000),
        celoResources: {
          ...accountFixture.celoResources,
          lockedBalance: BigNumber(44444),
        },
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        fees: BigNumber(2),
        amount: BigNumber(200),
        mode: "vote",
      },
    );

    expect(transactionStatus.errors["amount"].name).toEqual("NotEnoughBalance");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(transactionStatus.errors).not.toHaveProperty("recipient");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should return an NotEnoughBalance error for a revoke transaction where the amount is higher than the total non-voting locked balance", async () => {
    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: BigNumber(10000000000000000),
        spendableBalance: BigNumber(10000000000000000),
        celoResources: {
          ...accountFixture.celoResources,
          lockedBalance: BigNumber(44444),
          votes: [
            {
              activatable: true,
              amount: BigNumber(109),
              index: 0,
              revokable: true,
              type: "active",
              validatorGroup: transactionFixture.recipient,
            },
          ],
        },
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        useAllAmount: true,
        fees: BigNumber(2),
        mode: "revoke",
      },
    );

    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(transactionStatus.errors).not.toHaveProperty("fees");
    expect(transactionStatus.errors).not.toHaveProperty("recipient");
    expect(Object.keys(transactionStatus.warnings).length).toEqual(0);
  });

  it("should not return amount error for send when amount is less than gas fee", async () => {
    const twoCelo = new BigNumber(10).pow(18).times(2);
    const amountLessThanFee = new BigNumber(10);
    const gasFee = new BigNumber(24);

    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: twoCelo,
        spendableBalance: twoCelo,
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        mode: "send",
        amount: amountLessThanFee,
        fees: gasFee,
      },
    );

    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(transactionStatus.totalSpent).toEqual(amountLessThanFee.plus(gasFee));
  });

  it("should not return amount error for send when amount is less than 1 CELO but greater than gas fee", async () => {
    const oneCelo = new BigNumber(10).pow(18);
    const pointOneCelo = new BigNumber(10).pow(17);
    const gasFee = new BigNumber(24);

    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: oneCelo,
        spendableBalance: oneCelo,
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        mode: "send",
        amount: pointOneCelo,
        fees: gasFee,
      },
    );

    expect(transactionStatus.errors).not.toHaveProperty("amount");
    expect(transactionStatus.estimatedFees).toEqual(gasFee);
  });

  it("should convert fees from 18 decimals to 6 decimals when using USDC fee currency", async () => {
    const feeInWei = new BigNumber("1000000000000000000"); // 1 CELO in Wei (18 decimals)
    const expectedFeeInUsdc = new BigNumber("1000000"); // 1 USDC in 6 decimals

    const transactionStatus = await getTransactionStatus(
      {
        ...accountWithTokenAccountFixture,
        balance: BigNumber(123),
        spendableBalance: BigNumber(123),
      },
      {
        ...transactionWithUsdcFeeFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(10),
        fees: feeInWei,
      },
    );

    // Fees should be converted to 6 decimals for display
    expect(transactionStatus.estimatedFees).toEqual(expectedFeeInUsdc);
  });

  it("should calculate totalSpent correctly when paying fees in same currency (native CELO)", async () => {
    const amount = new BigNumber("1000000000000000000"); // 1 CELO
    const fees = new BigNumber("100000000000000000"); // 0.1 CELO
    const expectedTotalSpent = amount.plus(fees);

    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: BigNumber("10000000000000000000"),
        spendableBalance: BigNumber("10000000000000000000"),
      },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount,
        fees,
      },
    );

    expect(transactionStatus.totalSpent).toEqual(expectedTotalSpent);
  });

  it("should calculate totalSpent as just amount when paying fees in different currency", async () => {
    const amount = new BigNumber("1000000000000000000"); // 1 CELO
    const fees = new BigNumber("100000000000000000"); // 0.1 CELO in Wei

    const transactionStatus = await getTransactionStatus(
      {
        ...accountFixture,
        balance: BigNumber("10000000000000000000"),
        spendableBalance: BigNumber("10000000000000000000"),
      },
      {
        ...transactionWithUsdcFeeFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount,
        fees,
      },
    );

    // When paying fees in USDC, totalSpent should be just the amount (can't add different currencies)
    expect(transactionStatus.totalSpent).toEqual(amount);
  });

  it("should calculate totalSpent correctly for token transfer with fees paid in same token", async () => {
    const amount = new BigNumber("1000000"); // 1 USDC in 6 decimals
    const feeInWei = new BigNumber("100000000000000000"); // 0.1 USDC in Wei
    const feeInUsdc = new BigNumber("100000"); // 0.1 USDC in 6 decimals
    const expectedTotalSpent = amount.plus(feeInUsdc);

    const transactionStatus = await getTransactionStatus(accountWithTokenAccountFixture, {
      ...tokenTransactionWithUsdcFeeFixture,
      subAccountId: usdcTokenAccount.id, // Use USDC token account so fees are in same token
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      amount,
      fees: feeInWei,
    });

    // Fees should be converted to 6 decimals and added to amount
    expect(transactionStatus.totalSpent).toEqual(expectedTotalSpent);
    expect(transactionStatus.estimatedFees).toEqual(feeInUsdc);
  });

  it("should keep fees in Wei (18 decimals) when no fee currency is specified", async () => {
    const feeInWei = new BigNumber("100000000000000000"); // 0.1 CELO in Wei

    const transactionStatus = await getTransactionStatus(
      { ...accountFixture, balance: BigNumber(123), spendableBalance: BigNumber(123) },
      {
        ...transactionFixture,
        recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
        amount: BigNumber(10),
        fees: feeInWei,
      },
    );

    // Fees should remain in Wei when no fee currency is specified
    expect(transactionStatus.estimatedFees).toEqual(feeInWei);
  });

  it("should handle token transfer with fees paid in different token (USDC)", async () => {
    const amount = new BigNumber("500000"); // 0.5 USDT in 6 decimals
    const feeInWei = new BigNumber("100000000000000000"); // 0.1 USDC in Wei
    const feeInUsdc = new BigNumber("100000"); // 0.1 USDC in 6 decimals

    const transactionStatus = await getTransactionStatus(accountWithTokenAccountFixture, {
      ...tokenTransactionFixture,
      feeCurrency: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
      feeCurrencyUnwrapped: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
      feeCurrencyAccountId: usdcTokenAccount.id,
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      amount,
      fees: feeInWei,
    });

    // When sending USDT and paying with USDC, totalSpent should be just the USDT amount
    expect(transactionStatus.totalSpent).toEqual(amount);
    expect(transactionStatus.estimatedFees).toEqual(feeInUsdc);
  });

  it("should return NotEnoughBalance error when fee token balance is insufficient", async () => {
    const amount = new BigNumber("100000"); // 0.1 USDT in 6 decimals
    const feeInWei = new BigNumber("2000000000000000000000"); // 2000 USDC in Wei (18 decimals)

    const transactionStatus = await getTransactionStatus(accountWithTokenAccountFixture, {
      ...tokenTransactionFixture,
      subAccountId: "usdtTokenAccountId", // Use USDT account which has sufficient balance
      feeCurrency: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
      feeCurrencyUnwrapped: "0xceba9300f2b948710d2653dd7b07f33a8b32118c" as `0x${string}`,
      feeCurrencyAccountId: usdcTokenAccount.id,
      recipient: "0x79D5A290D7ba4b99322d91b577589e8d0BF87072",
      amount,
      fees: feeInWei,
    });

    // Should return NotEnoughBalance error for fees since USDC balance is 1000 USDC but fee requires 2000 USDC
    expect(transactionStatus.errors["fees"].name).toEqual("NotEnoughBalance");
    expect(transactionStatus.errors).not.toHaveProperty("amount");
  });
});
