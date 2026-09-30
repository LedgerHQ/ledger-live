import { renderHook } from "@testing-library/react";
import { PayCardTransactionSchema } from "@domain/api-card-management";
import { mockPayCardTransactions } from "@domain/api-card-management/mock/card-transactions";
import { CATEGORY_LABELS, DETAIL_COPY, cardApiWrapper } from "../../../__tests__/cardApiStore";
import { useCardTransactionDetailViewModel } from "./useCardTransactionDetailViewModel";

const transaction = PayCardTransactionSchema.parse(mockPayCardTransactions()[0]);
const CASHBACK = `${transaction.cashback?.amount} ${transaction.cashback?.currency}`;

describe("useCardTransactionDetailViewModel", () => {
  it("builds the amount, status, card, funding source, cashback and transaction id rows", () => {
    const { result } = renderHook(() => useCardTransactionDetailViewModel({ transaction }), {
      wrapper: cardApiWrapper(),
    });

    expect(result.current.merchant).toBe("NETFLIX.COM");
    expect(result.current.categoryLabel).toBe(CATEGORY_LABELS.SUBSCRIPTIONS);
    expect(result.current.rows.map(row => row.id)).toEqual([
      "amount",
      "status",
      "card",
      "fundingSource",
      "cashback",
      "transactionId",
    ]);
    expect(result.current.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "amount",
          label: DETAIL_COPY.amount,
          value: "-12.99 EUR",
        }),
        expect.objectContaining({
          id: "status",
          label: DETAIL_COPY.status,
          value: DETAIL_COPY.statusValues.CONFIRMED,
          statusAppearance: "success",
        }),
        expect.objectContaining({
          id: "card",
          label: DETAIL_COPY.card,
          value: "***9189",
          infoLabel: DETAIL_COPY.cardInfo,
        }),
        expect.objectContaining({
          id: "fundingSource",
          label: DETAIL_COPY.fundingSource_one,
          value: "-13.0214 USDC",
        }),
        expect.objectContaining({
          id: "cashback",
          label: DETAIL_COPY.cashback,
          value: CASHBACK,
        }),
        expect.objectContaining({
          id: "transactionId",
          label: DETAIL_COPY.transactionId,
          value: transaction.transactionId,
        }),
      ]),
    );
  });

  it("counts the funding assets under a plural label, keeping the breakdown in the tooltip", () => {
    const fundingSources = [
      { currency: "usdc", amount: "13.0214", sign: "DEBIT" as const },
      { currency: "btc", amount: "0.00005231", sign: "DEBIT" as const },
    ];
    const { result } = renderHook(
      () => useCardTransactionDetailViewModel({ transaction: { ...transaction, fundingSources } }),
      { wrapper: cardApiWrapper() },
    );

    expect(result.current.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "fundingSource",
          label: DETAIL_COPY.fundingSource_other,
          value: "Paid with 2 assets",
          infoLabel: "-13.0214 USDC · -0.00005231 BTC",
        }),
      ]),
    );
  });

  it("omits unavailable optional rows", () => {
    const { result } = renderHook(
      () =>
        useCardTransactionDetailViewModel({
          transaction: {
            ...transaction,
            panLast4: undefined,
            transactionId: undefined,
            fundingSources: undefined,
            cashback: undefined,
          },
        }),
      { wrapper: cardApiWrapper() },
    );

    expect(result.current.rows.map(row => row.id)).toEqual(["amount", "status"]);
  });
});
