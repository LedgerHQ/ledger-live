import { accountFixture, transactionFixture } from "../../bridge/fixtures";
import getTransactionStatus from "../../bridge/getTransactionStatus";
import BigNumber from "bignumber.js";

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
});
