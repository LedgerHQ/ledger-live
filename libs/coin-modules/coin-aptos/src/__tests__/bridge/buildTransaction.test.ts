import {
  createFixtureAccount,
  createFixtureAccountWithSubAccount,
  createFixtureTransaction,
  createFixtureTransactionWithSubAccount,
} from "../../bridge/bridge.fixture";
import buildTransaction from "../../bridge/buildTransaction";
import { AptosAPI } from "../../api";
import { normalizeTransactionOptions } from "../../bridge/logic";
import { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { TransactionOptions } from "../../types";

const generateTransaction = jest.fn(() => "tx");

jest.mock("../../bridge/logic", () => ({
  normalizeTransactionOptions: jest.fn(() => ({
    maxGasAmount: "100",
    gasUnitPrice: "200",
  })),
  DEFAULT_GAS: 100,
  DEFAULT_GAS_PRICE: 200,
}));

jest.mock("../../api", () => {
  return {
    AptosAPI: function () {
      return {
        generateTransaction,
      };
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("buildTransaction Test", () => {
  it("should return transaction for main account", async () => {
    const account = createFixtureAccount();
    const transaction = createFixtureTransaction();
    const aptosClient = new AptosAPI(account.currency.id);
    const result = await buildTransaction(account, transaction, aptosClient);

    const expected = "tx";

    expect(result).toBe(expected);

    const mockedNormalizeTransactionOptions = jest.mocked(normalizeTransactionOptions);

    expect(mockedNormalizeTransactionOptions).toHaveBeenCalledTimes(1);
    expect(generateTransaction).toHaveBeenCalledTimes(1);

    const generateTransactionArgs: [string, InputEntryFunctionData, TransactionOptions][] =
      generateTransaction.mock.calls[0];

    expect(mockedNormalizeTransactionOptions.mock.calls[0][0]).toEqual({
      maxGasAmount: "0",
      gasUnitPrice: "0",
    });

    expect(generateTransactionArgs[0]).toBe("address");
    expect(generateTransactionArgs[1]).toEqual({
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: ["recipient", "0"],
    });
    expect(generateTransactionArgs[2]).toEqual({ maxGasAmount: "100", gasUnitPrice: "200" });
  });

  it("should return transaction for token account of type fungible asset", async () => {
    const account = createFixtureAccountWithSubAccount("fungible_asset");
    const transaction = createFixtureTransactionWithSubAccount();
    const aptosClient = new AptosAPI(account.currency.id);
    const result = await buildTransaction(account, transaction, aptosClient);

    const expected = "tx";

    expect(result).toBe(expected);

    const mockedNormalizeTransactionOptions = jest.mocked(normalizeTransactionOptions);

    expect(mockedNormalizeTransactionOptions).toHaveBeenCalledTimes(1);
    expect(generateTransaction).toHaveBeenCalledTimes(1);

    const generateTransactionArgs: [string, InputEntryFunctionData, TransactionOptions][] =
      generateTransaction.mock.calls[0];

    expect(mockedNormalizeTransactionOptions.mock.calls[0][0]).toEqual({
      maxGasAmount: "0",
      gasUnitPrice: "0",
    });

    expect(generateTransactionArgs[0]).toBe("address");
    expect(generateTransactionArgs[1]).toEqual({
      function: "0x1::primary_fungible_store::transfer",
      typeArguments: ["0x1::fungible_asset::Metadata"],
      functionArguments: [["contract_address"], "recipient", "0"],
    });
    expect(generateTransactionArgs[2]).toEqual({ maxGasAmount: "100", gasUnitPrice: "200" });
  });

  it("should return transaction for token account of type fungible asset", async () => {
    const account = createFixtureAccountWithSubAccount("coin");
    const transaction = createFixtureTransactionWithSubAccount();
    const aptosClient = new AptosAPI(account.currency.id);
    const result = await buildTransaction(account, transaction, aptosClient);

    const expected = "tx";

    expect(result).toBe(expected);

    const mockedNormalizeTransactionOptions = jest.mocked(normalizeTransactionOptions);

    expect(mockedNormalizeTransactionOptions).toHaveBeenCalledTimes(1);
    expect(generateTransaction).toHaveBeenCalledTimes(1);

    const generateTransactionArgs: [string, InputEntryFunctionData, TransactionOptions][] =
      generateTransaction.mock.calls[0];

    expect(mockedNormalizeTransactionOptions.mock.calls[0][0]).toEqual({
      maxGasAmount: "0",
      gasUnitPrice: "0",
    });

    expect(generateTransactionArgs[0]).toBe("address");
    expect(generateTransactionArgs[1]).toEqual({
      function: "0x1::coin::transfer",
      typeArguments: ["contract_address"],
      functionArguments: ["recipient", "0"],
    });
    expect(generateTransactionArgs[2]).toEqual({ maxGasAmount: "100", gasUnitPrice: "200" });
  });

  it("should throw error if token is not supported", async () => {
    const account = createFixtureAccountWithSubAccount("not_supported_token_type");
    const transaction = createFixtureTransactionWithSubAccount();
    const aptosClient = new AptosAPI(account.currency.id);
    expect(async () => await buildTransaction(account, transaction, aptosClient)).rejects.toThrow(
      "Token type not_supported_token_type not supported",
    );
  });
});
