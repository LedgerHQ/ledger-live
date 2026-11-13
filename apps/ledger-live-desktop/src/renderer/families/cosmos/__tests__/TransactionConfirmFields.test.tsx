import React from "react";
import type { Transaction } from "@ledgerhq/live-common/families/cosmos/types";
import { render, screen } from "tests/testSetup";
import TransactionConfirmFields, { Title, Warning } from "../TransactionConfirmFields";

const MemoField = TransactionConfirmFields.fieldComponents["cosmos.memo"];

const makeTransaction = (mode: Transaction["mode"]) => ({ family: "cosmos", mode }) as Transaction;

describe("cosmos TransactionConfirmFields", () => {
  describe("Warning", () => {
    it.each([
      "delegate",
      "undelegate",
      "redelegate",
      "claimReward",
      "claimRewardCompound",
    ] as const)("renders nothing for the %s staking mode", mode => {
      const { container } = render(
        <Warning transaction={makeTransaction(mode)} recipientWording="validator" />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing for compoundReward, the mode emitted by the claim rewards selector", () => {
      const { container } = render(
        <Warning transaction={makeTransaction("compoundReward")} recipientWording="validator" />,
      );
      expect(container).toBeEmptyDOMElement();
    });

    it("still warns about the address for a plain send", () => {
      render(<Warning transaction={makeTransaction("send")} recipientWording="recipient" />);
      expect(screen.getByText(/Always verify the address displayed on your device/)).toBeVisible();
    });
  });

  describe("Title", () => {
    it("resolves a translated title for compoundReward instead of the raw i18n key", () => {
      render(<Title transaction={makeTransaction("compoundReward")} />);
      expect(screen.queryByText(/titleWording/)).toBeNull();
      expect(
        screen.getByText("Please confirm on your device to finalize the operation"),
      ).toBeVisible();
    });
  });

  describe("memo field", () => {
    const renderMemoField = (transaction: Transaction) =>
      render(
        <MemoField
          account={{} as never}
          parentAccount={undefined}
          transaction={transaction}
          status={{} as never}
          field={{ type: "cosmos.memo", label: "Memo" } as never}
        />,
      );

    it("shows the memoValue of the transaction", () => {
      renderMemoField({ family: "cosmos", mode: "send", memoValue: "invoice 42" } as Transaction);

      expect(screen.getByText("Memo")).toBeVisible();
      expect(screen.getByText("invoice 42")).toBeVisible();
    });

    it("renders nothing when memoValue is empty", () => {
      const { container } = renderMemoField({
        family: "cosmos",
        mode: "send",
        memoValue: null,
      } as Transaction);

      expect(container).toBeEmptyDOMElement();
    });
  });
});
