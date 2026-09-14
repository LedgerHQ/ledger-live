import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { transactionClickedProperties } from "./transactionClickedProperties";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);

describe("transactionClickedProperties", () => {
  it("maps a debit to an outbound card click without amounts", () => {
    expect(transactionClickedProperties(transaction)).toEqual({
      category: "card",
      transaction: "out",
      page: "Pay",
      cardFundSourceAsset: "USDC",
    });
  });

  it("maps a credit to an inbound card click", () => {
    expect(transactionClickedProperties({ ...transaction, sign: "CREDIT" }).transaction).toBe("in");
  });

  it("omits the funding asset when the charge has none", () => {
    expect(transactionClickedProperties({ ...transaction, fundingSources: undefined })).toEqual({
      category: "card",
      transaction: "out",
      page: "Pay",
    });
  });
});
