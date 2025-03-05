import BigNumber from "bignumber.js";
import createTransaction from "../../bridge/createTransaction";

jest.mock("../../bridge/logic", () => ({
  DEFAULT_GAS: 100,
  DEFAULT_GAS_PRICE: 200,
}));

describe("createTransaction Test", () => {
  it("should return a transaction object", async () => {
    const result = createTransaction();

    const expected = {
      family: "aptos",
      mode: "send",
      amount: BigNumber(0),
      recipient: "",
      useAllAmount: false,
      options: {
        maxGasAmount: "100",
        gasUnitPrice: "200",
      },
    };

    expect(result).toEqual(expected);
  });
});
