import BigNumber from "bignumber.js";
import { getMaxAmount, getTotalSpent } from "./logic";
import { NearAccount, Transaction } from "./types";

describe("getMaxAmount", () => {
  const spendableBalance = 1_000_000;
  const pendingOperations = [
    {
      type: "SEND",
      value: new BigNumber(1_234),
      recipients: "02645948421CEE96A0F9B53E8EC414047B25194120FDF926F955D5F38D756346",
    },
    {
      type: "UNSTAKE",
      value: new BigNumber(5_678),
      recipients: "2E627FBC1128A1A9899660B86114766C5C2C5902D230DF6EFAB68F4FC47E36C7",
    },
    {
      type: "WITHDRAW_UNSTAKED",
      value: new BigNumber(9_012),
      recipients: "3E8D8A4CF7BFBDCFC314DBEDD2FFD413E5707ACA75B06523759D46AAA1BB788F",
    },
  ];

  it.each([
    {
      // Returns spendableBalance as no fees
      name: "send",
      transaction: {
        mode: "send",
      } as Transaction,
      fees: 0,
      expectedAmount: spendableBalance,
    },
    {
      // Returns spendableBalance minus fees
      name: "send",
      transaction: {
        mode: "send",
      } as Transaction,
      fees: 100,
      expectedAmount: spendableBalance - 100,
    },
    {
      // Returns 0 as no value is staked
      name: "unstake",
      transaction: {
        mode: "unstake",
      } as Transaction,
      fees: 100,
      expectedAmount: 0,
    },
    {
      // Returns 0 as no reward is available
      name: "withdraw",
      transaction: {
        mode: "withdraw",
      } as Transaction,
      fees: 100,
      expectedAmount: 0,
    },
  ])(
    "returns expected amount with no pendingOperations and whatever transaction of type $name",
    ({ transaction, fees, expectedAmount }) => {
      // Given
      const account = {
        spendableBalance: new BigNumber(spendableBalance),
        pendingOperations: [],
      } as unknown as NearAccount;

      // When
      const result = getMaxAmount(account, transaction, new BigNumber(fees));

      // Then
      expect(result).toEqual(new BigNumber(expectedAmount));
    },
  );

  describe("when account has pending operations", () => {
    it.each([
      {
        // Returns spendableBalance minus the fees, whatever the types
        name: "send",
        transaction: {
          mode: "send",
        } as Transaction,
        fees: 100,
        expectedAmount: spendableBalance - 100,
      },
      {
        // Returns 0 as no value is staked
        name: "unstake",
        transaction: {
          mode: "unstake",
        } as Transaction,
        fees: 100,
        expectedAmount: 0,
      },
      {
        // Returns 0 as no reward is available
        name: "withdraw",
        transaction: {
          mode: "withdraw",
        } as Transaction,
        fees: 100,
        expectedAmount: 0,
      },
    ])(
      "returns expected amount for whatever transaction of type $name",
      ({ transaction, fees, expectedAmount }) => {
        // Given
        const account = {
          spendableBalance: new BigNumber(spendableBalance),
          pendingOperations,
        } as unknown as NearAccount;

        // When
        const result = getMaxAmount(account, transaction, new BigNumber(fees));

        // Then
        expect(result).toEqual(new BigNumber(expectedAmount));
      },
    );

    it("returns the spendable amount when no fees are provided", () => {
      // Given
      const account = {
        spendableBalance: new BigNumber(spendableBalance),
        pendingOperations,
      } as unknown as NearAccount;
      const transaction = {
        mode: "send",
      } as Transaction;
      const expectedAmount = spendableBalance;

      // When
      const result = getMaxAmount(account, transaction);

      // Then
      expect(result).toEqual(new BigNumber(expectedAmount));
    });
  });

  describe("when account has staking position", () => {
    const nearResources = {
      stakingPositions: [
        {
          validatorId: "",
          staked: new BigNumber(2_345),
          available: new BigNumber(3_456),
        },
        {
          validatorId: "2E627FBC1128A1A9899660B86114766C5C2C5902D230DF6EFAB68F4FC47E36C7",
          staked: new BigNumber(4_567),
          available: new BigNumber(6_789),
        },
        {
          validatorId: "3E8D8A4CF7BFBDCFC314DBEDD2FFD413E5707ACA75B06523759D46AAA1BB788F",
          staked: new BigNumber(7_890),
          available: new BigNumber(8_901),
        },
      ],
    };

    it.each([
      {
        // Returns spendableBalance minus all pending operations, whatever the types
        name: "send",
        transaction: {
          mode: "send",
        } as Transaction,
        fees: 100,
        expectedAmount: spendableBalance - 100,
      },
      {
        // Returns 0 as no value is staked
        name: "unstake",
        transaction: {
          mode: "unstake",
          recipient: "2E627FBC1128A1A9899660B86114766C5C2C5902D230DF6EFAB68F4FC47E36C7",
        } as Transaction,
        fees: 100,
        expectedAmount: 4_567,
      },
      {
        // Returns 0 as no reward is available
        name: "withdraw",
        transaction: {
          mode: "withdraw",
          recipient: "3E8D8A4CF7BFBDCFC314DBEDD2FFD413E5707ACA75B06523759D46AAA1BB788F",
        } as Transaction,
        fees: 100,
        expectedAmount: 8_901,
      },
    ])(
      "returns expected amount with pendingOperations and whatever transaction of type $name",
      ({ transaction, fees, expectedAmount }) => {
        // Given
        const account = {
          spendableBalance: new BigNumber(spendableBalance),
          pendingOperations,
          nearResources,
        } as unknown as NearAccount;

        // When
        const result = getMaxAmount(account, transaction, new BigNumber(fees));

        // Then
        expect(result).toEqual(new BigNumber(expectedAmount));
      },
    );
  });
});

describe("getTotalSpent", () => {
  it.each([
    {
      name: "unstake",
      transaction: {
        mode: "unstake",
      } as Transaction,
      fees: 123,
      expectedResult: 123,
    },
    {
      name: "withdraw",
      transaction: {
        mode: "withdraw",
      } as Transaction,
      fees: 456,
      expectedResult: 456,
    },
  ])("returns the fees value if transaction is $name", ({ fees, transaction, expectedResult }) => {
    // When
    const result = getTotalSpent({} as NearAccount, transaction, new BigNumber(fees));

    // Then
    expect(result).toEqual(new BigNumber(expectedResult));
  });

  it("returns the addition of transaction fees and amount if transaction is a send", () => {
    // Given
    const amount = 5_678;
    const transaction = {
      mode: "send",
      amount: new BigNumber(amount),
    } as Transaction;
    const fees = 123;

    // When
    const result = getTotalSpent({} as NearAccount, transaction, new BigNumber(fees));

    // Then
    expect(result).toEqual(new BigNumber(amount + fees));
  });

  it("returns the account spendable balance if transaction is set to 'useAllAmount'", () => {
    // Given
    const spendableBalance = new BigNumber(9_900);
    const account = { spendableBalance } as NearAccount;
    const transaction = {
      mode: "send",
      useAllAmount: true,
    } as Transaction;
    const fees = 123;

    // When
    const result = getTotalSpent(account, transaction, new BigNumber(fees));

    // Then
    expect(result).toEqual(spendableBalance);
  });
});
