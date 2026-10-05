import type { TransactionStatus } from "@ledgerhq/live-common/generated/types";
import {
  createTrackedMessage,
  getActiveWarningIds,
  getAddressValidationMessageId,
  getSuppressedMessageIds,
} from "../messageTracking";

function namedError(name: string): Error {
  const error = new Error();
  error.name = name;
  return error;
}

describe("send flow message tracking", () => {
  it.each(["NotEnoughGas", "NotEnoughBalance", "NotEnoughBalanceFees", "NotEnoughVTHO"])(
    "keeps %s identifiable",
    messageId => {
      const error = namedError(messageId);
      const status: Pick<TransactionStatus, "errors" | "warnings"> = {
        errors: { amount: error },
        warnings: {},
      };

      expect(createTrackedMessage(error, "error", status)).toEqual({
        messageId,
        messageType: "error",
        suppressedErrors: [],
      });
    },
  );

  it("keeps non-primary conditions in suppressed_errors without duplicates", () => {
    const status: Pick<TransactionStatus, "errors" | "warnings"> = {
      errors: {
        amount: namedError("NotEnoughBalance"),
        fees: namedError("NotEnoughGas"),
      },
      warnings: {
        feeTooHigh: namedError("FeeTooHigh"),
      },
    };

    expect(
      getSuppressedMessageIds(status, "NotEnoughBalance", ["MaxFeeTooLow", "NotEnoughGas"]),
    ).toEqual(["NotEnoughGas", "FeeTooHigh", "MaxFeeTooLow"]);
  });

  it("uses status keys for generic errors without exposing their messages", () => {
    const amountError = new Error("Amount must be positive");
    const feeError = new Error("Fee contains potentially sensitive details");
    const status: Pick<TransactionStatus, "errors" | "warnings"> = {
      errors: {
        amount: amountError,
        fees: feeError,
      },
      warnings: {},
    };

    expect(createTrackedMessage(amountError, "error", status)).toEqual({
      messageId: "error:amount",
      messageType: "error",
      suppressedErrors: ["error:fees"],
    });
  });

  it("collects active warnings for transition events", () => {
    const status: Pick<TransactionStatus, "warnings"> = {
      warnings: {
        recipient: namedError("ETHAddressNonEIP"),
        feeTooHigh: namedError("FeeTooHigh"),
      },
    };

    expect(getActiveWarningIds(status)).toEqual(["ETHAddressNonEIP", "FeeTooHigh"]);
  });

  it("uses status keys for generic active warnings", () => {
    const status: Pick<TransactionStatus, "warnings"> = {
      warnings: {
        feeTooHigh: new Error("Fees are high"),
      },
    };

    expect(getActiveWarningIds(status)).toEqual(["warning:feeTooHigh"]);
  });

  it("ignores undefined optional bridge error entries", () => {
    expect(
      getSuppressedMessageIds(
        {
          errors: {
            recipient: namedError("InvalidAddress"),
            sender: undefined,
          },
          warnings: {},
        },
        "InvalidAddress",
      ),
    ).toEqual([]);
  });

  it("maps local recipient validation to stable identifiers", () => {
    expect(getAddressValidationMessageId("incorrect_format")).toBe(
      "newSendFlow.errors.incorrectFormat",
    );
    expect(getAddressValidationMessageId("wallet_not_exist")).toBe("newSendFlow.addressNotFound");
    expect(getAddressValidationMessageId("incompatible_asset")).toBe(
      "newSendFlow.errors.incompatibleAsset",
    );
    expect(getAddressValidationMessageId("sanctioned")).toBe("sanctioned");
  });
});
