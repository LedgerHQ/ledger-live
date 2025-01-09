import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import createTransaction from "./createTransaction";
import buildTransaction from "./buildTransaction";
import { AptosAPI } from "./api";
import { normalizeTransactionOptions } from "./logic";
import { InputEntryFunctionData } from "@aptos-labs/ts-sdk";
import { TransactionOptions } from "./types";

const generateTransaction = jest.fn(() => "tx");

jest.mock("./logic", () => ({
  normalizeTransactionOptions: jest.fn(() => ({
    maxGasAmount: "100",
    gasUnitPrice: "200",
  })),
  DEFAULT_GAS: 100,
  DEFAULT_GAS_PRICE: 200,
}));

jest.mock("./api", () => {
  return {
    AptosAPI: function () {
      return {
        generateTransaction,
      };
    },
  };
});

describe("buildTransaction Test", () => {
  it("should return tx", async () => {
    const account = createFixtureAccount();
    const transaction = createTransaction();
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
      maxGasAmount: "100",
      gasUnitPrice: "200",
    });

    expect(generateTransactionArgs[0]).toBe("0x01");
    expect(generateTransactionArgs[1]).toEqual({
      function: "0x1::aptos_account::transfer_coins",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: ["", "0"],
    });
    expect(generateTransactionArgs[2]).toEqual({ maxGasAmount: "100", gasUnitPrice: "200" });
  });
});
