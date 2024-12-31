import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";
import createTransaction from "./createTransaction";
import buildTransaction from "./buildTransaction";
import { AptosAPI } from "./api";

jest.mock("./logic", () => ({
  normalizeTransactionOptions: jest.fn(),
  DEFAULT_GAS: 100,
  DEFAULT_GAS_PRICE: 200,
}));

jest.mock("./api", () => {
  return {
    AptosAPI: function () {
      return {
        generateTransaction: jest.fn(() => "tx"),
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
  });
});
