import BigNumber from "bignumber.js";
import {
  createFixtureAccount,
  createFixtureAccountWithSubAccount,
  createFixtureTransaction,
  createFixtureTransactionWithSubAccount,
} from "../../bridge/bridge.fixture";
import * as getFeesForTransaction from "../../bridge/getFeesForTransaction";
import { AptosAPI } from "../../network";

let simulateTransaction = jest.fn();

jest.mock("../../network", () => {
  return {
    AptosAPI: function () {
      return {
        estimateGasPrice: jest.fn(() => ({ gas_estimate: 101 })),
        generateTransaction: jest.fn(() => "tx"),
        simulateTransaction,
        getAccount: jest.fn(() => ({ sequence_number: "123" })),
      };
    },
  };
});

jest.mock("@aptos-labs/ts-sdk", () => {
  return {
    Ed25519PublicKey: jest.fn(),
  };
});

const mockedGetTokenAccount = jest.fn();

describe("getFeesForTransaction Test", () => {
  beforeEach(() => {
    jest.mock("../../bridge/logic", () => ({
      DEFAULT_GAS: 201,
      DEFAULT_GAS_PRICE: 101,
      ESTIMATE_GAS_MUL: 1,
      normalizeTransactionOptions: jest.fn(),
      getTokenAccount: mockedGetTokenAccount,
    }));
  });
  describe("when using getFee", () => {
    describe("with vm_status as INSUFFICIENT_BALANCE", () => {
      it("should return a fee estimation object", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: false,
            vm_status: ["INSUFFICIENT_BALANCE"],
            expiration_timestamp_secs: 5,
            gas_used: "202",
            gas_unit_price: "102",
          },
        ]);
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20604),
          estimate: {
            maxGasAmount: "202",
            gasUnitPrice: "102",
          },
          errors: {},
        };

        expect(result).toEqual(expected);
      });

      it("should return a fee estimation object for the token transaction", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: true,
            vm_status: [],
            expiration_timestamp_secs: 5,
            gas_used: "202",
            gas_unit_price: "102",
          },
        ]);
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccountWithSubAccount("coin");
        const transaction = createFixtureTransactionWithSubAccount();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20604),
          estimate: {
            maxGasAmount: "202",
            gasUnitPrice: "102",
          },
          errors: {},
        };

        expect(result).toEqual(expected);
      });
    });

    describe("with vm_status as DUMMY_STATE", () => {
      it("should return a fee estimation object", () => {
        simulateTransaction = jest.fn(() => [
          {
            success: false,
            vm_status: ["DUMMY_STATE"],
            expiration_timestamp_secs: 5,
            gas_used: "9",
            gas_unit_price: "100",
          },
        ]);
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        expect(async () => {
          await getFeesForTransaction.getFee(account, transaction, aptosClient);
        }).rejects.toThrow("Simulation failed with following error: DUMMY_STATE");
      });
    });

    describe("with vm_status as MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS", () => {
      it("should return a fee estimation object with GasInsuficeinetBalance error", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: false,
            vm_status: ["MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS"],
            expiration_timestamp_secs: 5,
            gas_used: "0",
            gas_unit_price: "100",
          },
        ]);
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccountWithSubAccount("coin");
        const transaction = createFixtureTransactionWithSubAccount();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(0),
          estimate: {
            maxGasAmount: "0",
            gasUnitPrice: "100",
          },
          errors: {
            maxGasAmount: "GasInsufficientBalance",
          },
        };

        expect(result).toEqual(expected);
      });
    });
  });

  describe("when using getEstimatedGas", () => {
    describe("when key not in cache", () => {
      it("should return fee", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: true,
            vm_status: [],
            expiration_timestamp_secs: 5,
            gas_used: "9",
            gas_unit_price: "102",
          },
        ]);
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getEstimatedGas(
          account,
          transaction,
          aptosClient,
        );

        const expected = {
          errors: {},
          estimate: {
            gasUnitPrice: "102",
            maxGasAmount: "9",
          },
          fees: new BigNumber("918"),
        };

        expect(result).toEqual(expected);
      });
    });

    describe("when key is in cache", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should return cached fee", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: true,
            vm_status: [],
            expiration_timestamp_secs: 5,
            gas_used: "202",
            gas_unit_price: "102",
          },
        ]);
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccount();
        account.xpub = "xpub";
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(10);

        const result1 = await getFeesForTransaction.getEstimatedGas(
          account,
          transaction,
          aptosClient,
        );
        const result2 = await getFeesForTransaction.getEstimatedGas(
          account,
          transaction,
          aptosClient,
        );

        expect(simulateTransaction.mock.calls).toHaveLength(1);

        const expected = {
          errors: {},
          estimate: {
            gasUnitPrice: "102",
            maxGasAmount: "202",
          },
          fees: new BigNumber("20604"),
        };

        expect(result1).toEqual(expected);
        expect(result2).toEqual(expected);
      });
    });
  });

  describe("when key is in cache from a token account", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return cached fee", async () => {
      simulateTransaction = jest.fn(() => [
        {
          success: true,
          vm_status: [],
          expiration_timestamp_secs: 5,
          gas_used: "202",
          gas_unit_price: "102",
        },
      ]);
      mockedGetTokenAccount.mockReturnValue(undefined);

      const account = createFixtureAccountWithSubAccount("coin");
      account.xpub = "xpub";
      const transaction = createFixtureTransactionWithSubAccount();
      const aptosClient = new AptosAPI(account.currency.id);

      transaction.amount = new BigNumber(10);

      const result1 = await getFeesForTransaction.getEstimatedGas(
        account,
        transaction,
        aptosClient,
      );
      const result2 = await getFeesForTransaction.getEstimatedGas(
        account,
        transaction,
        aptosClient,
      );

      expect(simulateTransaction.mock.calls).toHaveLength(1);

      const expected = {
        errors: {},
        estimate: {
          gasUnitPrice: "102",
          maxGasAmount: "202",
        },
        fees: new BigNumber("20604"),
      };

      expect(result1).toEqual(expected);
      expect(result2).toEqual(expected);
    });
  });
});
