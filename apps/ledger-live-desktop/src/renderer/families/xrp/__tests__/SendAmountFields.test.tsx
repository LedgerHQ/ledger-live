import type { TransactionStatus } from "@ledgerhq/live-common/families/xrp/types";
import React from "react";
import { render, screen } from "tests/testSetup";
import SendAmountFields from "../SendAmountFields";

const Fields = SendAmountFields.component;

const makeError = (name: string, fields: object = {}) =>
  Object.assign(new Error(name), { name }, fields);

const renderFields = (errors: TransactionStatus["errors"]) =>
  render(<Fields status={{ errors, warnings: {} } as TransactionStatus} />);

describe("SendAmountFields (xrp)", () => {
  it("shows a recipient error from the dry run", () => {
    renderFields({ recipient: makeError("XrpTokenCannotReceive", { assetCode: "USD" }) });

    expect(screen.getByText("This recipient can't receive USD")).toBeInTheDocument();
  });

  it("shows a transaction error from the dry run", () => {
    renderFields({ transaction: makeError("XrpTransactionWouldFail", { code: "tecNO_AUTH" }) });

    expect(screen.getByText("This transaction would fail")).toBeInTheDocument();
    expect(screen.getByText("The XRP Ledger rejected it with tecNO_AUTH.")).toBeInTheDocument();
  });

  it("leaves the amount error to the amount field", () => {
    const { container } = renderFields({ amount: makeError("XrpAmountPrecisionExceeded") });

    expect(container).toBeEmptyDOMElement();
  });
});
