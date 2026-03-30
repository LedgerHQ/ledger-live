import { createTransaction } from "./createTransaction";

describe("createTransaction", () => {
  it("should create a 0 amount transaction", () => {
    expect(createTransaction({} as any).amount.toNumber()).toEqual(0);
  });

  it("should create a transaction with concordium family", () => {
    expect(createTransaction({} as any).family).toEqual("concordium");
  });

  it("should create a transaction with memo field initialized as undefined", () => {
    const transaction = createTransaction({} as any);
    expect(transaction.memo).toBeUndefined();
  });
});
