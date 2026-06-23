import BigNumber from "bignumber.js";
import {
  createFixtureAccount,
  createFixtureAccountWithSubAccount,
  createFixtureTransaction,
  createFixtureTransactionWithSubAccount,
} from "../../bridge/bridge.fixture";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../../constants";
import * as getFeesForTransaction from "../../bridge/getFeesForTransaction";
import { AptosAPI } from "../../network";

let simulateTransaction = jest.fn();
const generateTransaction = jest.fn(() => "tx");

jest.mock("../../network", () => {
  return {
    AptosAPI: function () {
      return {
        estimateGasPrice: jest.fn(() => ({ gas_estimate: 101 })),
        generateTransaction,
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
          fees: new BigNumber(22644),
          estimate: {
            maxGasAmount: "222",
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
          fees: new BigNumber(22644),
          estimate: {
            maxGasAmount: "222",
            gasUnitPrice: "102",
          },
          errors: {},
        };

        expect(result).toEqual(expected);
      });
    });

    describe("with vm_status as DUMMY_STATE", () => {
      it("should throw a simulation error", async () => {
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

        await expect(
          getFeesForTransaction.getFee(account, transaction, aptosClient),
        ).rejects.toThrow("Simulation failed with following error: DUMMY_STATE");
      });
    });

    describe("with vm_status as Out of gas", () => {
      it("should return GasInsufficientBalance without throwing", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: false,
            vm_status: "Move abort in 0x1::transaction_fee: EOUT_OF_GAS (Out of gas)",
            expiration_timestamp_secs: 5,
            gas_used: "100",
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

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        expect(result.errors.maxGasAmount).toBe("GasInsufficientBalance");
        // gas_used 100 * ESTIMATE_GAS_MUL (1.1) => 110 units @ gas_unit_price 100
        expect(result.fees).toStrictEqual(new BigNumber(11000));
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

    describe("with stale gas options on the transaction", () => {
      it("should simulate against the default gas options instead of reusing the stale ones", async () => {
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
        generateTransaction.mockClear();

        const account = createFixtureAccount();
        // Stale, too-tight gas options leaked from a previous estimation (e.g. the zero-amount
        // "use max" estimation) that would otherwise make the simulation run out of gas.
        const transaction = createFixtureTransaction({
          options: { maxGasAmount: "1", gasUnitPrice: "1" },
        });
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        expect(result.errors.maxGasAmount).toBeUndefined();
        const [, , optionsUsed] = generateTransaction.mock.calls.at(-1) as unknown as [
          string,
          unknown,
          { maxGasAmount: string; gasUnitPrice: string },
        ];
        expect(optionsUsed.maxGasAmount).toBe(DEFAULT_GAS.toString());
        expect(optionsUsed.gasUnitPrice).toBe(DEFAULT_GAS_PRICE.toString());
      });
    });

    describe("when simulateTransaction throws a non-simulation error", () => {
      it("should return default fee estimation when simulateTransaction throws an Error", async () => {
        simulateTransaction = jest.fn(() => {
          throw new Error("Network timeout");
        });
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: DEFAULT_GAS.multipliedBy(DEFAULT_GAS_PRICE),
          estimate: {
            maxGasAmount: DEFAULT_GAS.toString(),
            gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
          },
          errors: { ...transaction.errors },
        };

        expect(result).toEqual(expected);
      });

      it("should return default fee estimation when simulateTransaction throws a non-Error value", async () => {
        simulateTransaction = jest.fn(() => {
          throw "unexpected string error";
        });
        mockedGetTokenAccount.mockReturnValue(undefined);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: DEFAULT_GAS.multipliedBy(DEFAULT_GAS_PRICE),
          estimate: {
            maxGasAmount: DEFAULT_GAS.toString(),
            gasUnitPrice: DEFAULT_GAS_PRICE.toString(),
          },
          errors: { ...transaction.errors },
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
            maxGasAmount: "10",
          },
          fees: new BigNumber(1020),
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
            maxGasAmount: "222",
          },
          fees: new BigNumber(22644),
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
          maxGasAmount: "222",
        },
        fees: new BigNumber(22644),
      };

      expect(result1).toEqual(expected);
      expect(result2).toEqual(expected);
    });
  });
});
