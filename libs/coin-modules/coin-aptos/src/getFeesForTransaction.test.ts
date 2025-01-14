import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "./types/bridge.fixture";
import * as getFeesForTransaction from "./getFeesForTransaction";
import { AptosAPI } from "./api";

let simulateTransaction = jest.fn();

jest.mock("./api", () => {
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

jest.mock("./logic", () => {
  return {
    DEFAULT_GAS: 201,
    DEFAULT_GAS_PRICE: 101,
    ESTIMATE_GAS_MUL: 1,
    normalizeTransactionOptions: jest.fn(),
  };
});

describe("getFeesForTransaction Test", () => {
  describe("when using getFee", () => {
    describe("with vm_status as SEQUENCE_NUMBER", () => {
      it("should return a fee estimation object", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: false,
            vm_status: ["SEQUENCE_NUMBER"],
            expiration_timestamp_secs: 5,
          },
        ]);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20301),
          estimate: {
            maxGasAmount: "201",
            gasUnitPrice: "101",
            sequenceNumber: "123",
            expirationTimestampSecs: "",
          },
          errors: {
            sequenceNumber: ["SEQUENCE_NUMBER"],
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe("with vm_status as TRANSACTION_EXPIRED", () => {
      it("should return a fee estimation object", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: false,
            vm_status: ["TRANSACTION_EXPIRED"],
            expiration_timestamp_secs: 5,
          },
        ]);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20301),
          estimate: {
            maxGasAmount: "201",
            gasUnitPrice: "101",
            sequenceNumber: "123",
            expirationTimestampSecs: "",
          },
          errors: {
            expirationTimestampSecs: ["TRANSACTION_EXPIRED"],
          },
        };

        expect(result).toEqual(expected);
      });
    });

    describe("with vm_status as INSUFFICIENT_BALANCE", () => {
      it("should return a fee estimation object", async () => {
        simulateTransaction = jest.fn(() => [
          {
            success: false,
            vm_status: ["INSUFFICIENT_BALANCE"],
            expiration_timestamp_secs: 5,
          },
        ]);

        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFeesForTransaction.getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20301),
          estimate: {
            maxGasAmount: "201",
            gasUnitPrice: "101",
            sequenceNumber: "123",
            expirationTimestampSecs: "",
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
          },
        ]);

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
  });

  describe("when using getEstimatedGas", () => {
    describe("when key not in cache", () => {
      it("should return cached fee", async () => {
        const account = createFixtureAccount();
        const transaction = createFixtureTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        const result = await getFeesForTransaction.getEstimatedGas(
          account,
          transaction,
          aptosClient,
        );

        const expected = {
          errors: {},
          estimate: {
            expirationTimestampSecs: "",
            gasUnitPrice: "101",
            maxGasAmount: "201",
            sequenceNumber: "123",
          },
          fees: new BigNumber("20301"),
        };

        expect(result).toEqual(expected);
      });
    });

    describe("when key is in cache 22", () => {
      beforeEach(() => {
        jest.clearAllMocks();
      });

      it("should return cached fee", async () => {
        const mocked = jest.spyOn(getFeesForTransaction, "getFee");

        const account = createFixtureAccount();
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

        expect(mocked).toHaveBeenCalledTimes(1);

        const expected = {
          errors: {},
          estimate: {
            expirationTimestampSecs: "",
            gasUnitPrice: "101",
            maxGasAmount: "201",
            sequenceNumber: "123",
          },
          fees: new BigNumber("20301"),
        };

        expect(result1).toEqual(expected);
        expect(result2).toEqual(expected);
      });
    });
  });
});
