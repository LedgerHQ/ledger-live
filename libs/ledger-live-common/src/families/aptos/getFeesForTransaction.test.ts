import BigNumber from "bignumber.js";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import createTransaction from "./createTransaction";
import { getFee } from "./getFeesForTransaction";
import { AptosAPI } from "./api";

let simulateTransaction = jest.fn();

jest.mock("./api", () => {
  return {
    AptosAPI: function () {
      return {
        generateTransaction: jest.fn(() => "tx"),
        simulateTransaction,
      };
    },
  };
});

jest.mock("@aptos-labs/ts-sdk", () => {
  return {
    Ed25519PublicKey: jest.fn(),
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
        const transaction = createTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20000),
          estimate: {
            maxGasAmount: "200",
            gasUnitPrice: "100",
            sequenceNumber: "",
            expirationTimestampSecs: 5,
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
        const transaction = createTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20000),
          estimate: {
            maxGasAmount: "200",
            gasUnitPrice: "100",
            sequenceNumber: "",
            expirationTimestampSecs: 5,
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
        const transaction = createTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        const result = await getFee(account, transaction, aptosClient);

        const expected = {
          fees: new BigNumber(20000),
          estimate: {
            maxGasAmount: "200",
            gasUnitPrice: "100",
            sequenceNumber: "",
            expirationTimestampSecs: 5,
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
        const transaction = createTransaction();
        const aptosClient = new AptosAPI(account.currency.id);

        transaction.amount = new BigNumber(1);
        account.xpub = "xpub";
        account.spendableBalance = new BigNumber(100000000);

        expect(async () => {
          await getFee(account, transaction, aptosClient);
        }).rejects.toThrow("Simulation failed with following error: DUMMY_STATE");
      });
    });
  });

  describe("when using getCacheKey", () => {
    it("should return tx", async () => {});
  });

  describe("when using getEstimatedGas", () => {
    it("should return tx", async () => {});
  });
});
