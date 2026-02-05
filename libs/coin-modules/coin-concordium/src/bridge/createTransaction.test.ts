import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(createTransaction().amount.toNumber()).toEqual(0);
  });

  it("should create a transaction with concordium family", () => {
    expect(createTransaction().family).toEqual("concordium");
  });

  it("should create a transaction with memo field initialized as undefined", () => {
    const transaction = createTransaction();
    expect(transaction.memo).toBeUndefined();
  });
});
