import React from "react";
import { render, screen } from "@tests/test-renderer";
import {
  PLT_REJECT_CODES,
  type ConcordiumOperation,
} from "@ledgerhq/live-common/families/concordium/types";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra } = operationDetails;

const renderExtra = (extra: unknown) =>
  render(<OperationDetailsExtra operation={{ extra } as unknown as ConcordiumOperation} />);

describe("concordium OperationDetailsExtra", () => {
  it.each([
    ["nonExistentToken", /token doesn't exist on Concordium/],
    ["recipientNotFound", /recipient account doesn't exist/],
    ["insufficientBalance", /didn't hold enough of the token/],
    ["rejected", /Concordium refused this operation/],
  ])("explains the cause %s", (code, copy) => {
    renderExtra({ pltRejectCode: code });

    expect(screen.getByText("Reason")).toBeOnTheScreen();
    expect(screen.getByText(copy)).toBeOnTheScreen();
  });

  // The code is interpolated into the key, so a code without copy renders the
  // raw key path. Nothing else ties the two together.
  it.each([...PLT_REJECT_CODES])("has copy for the code %s", code => {
    renderExtra({ pltRejectCode: code });

    expect(screen.queryByText(/operationDetails\.extra/)).toBeNull();
  });

  it("shows the sender's memo", () => {
    renderExtra({ memo: "invoice 41" });

    expect(screen.getByText("Memo")).toBeOnTheScreen();
    expect(screen.getByText("invoice 41")).toBeOnTheScreen();
  });

  // Not reachable from the parser — a rejected operation reports no memo — but
  // `extra` is one slot and the two fields must not suppress each other.
  it("shows a memo and a cause together", () => {
    renderExtra({ memo: "invoice 41", pltRejectCode: "rejected" });

    expect(screen.getByText("invoice 41")).toBeOnTheScreen();
    expect(screen.getByText(/Concordium refused this operation/)).toBeOnTheScreen();
  });

  it.each([
    ["nothing at all", {}],
    ["extra absent altogether", undefined],
    ["an empty memo", { memo: "" }],
    ["a non-string memo", { memo: 7 }],
    ["a cause outside the set", { pltRejectCode: "operationNotPermitted" }],
    ["a cause that is a translation key", { pltRejectCode: "operationDetails.extra.memo" }],
    ["a non-string cause", { pltRejectCode: 7 }],
    ["a prototype key as the cause", { pltRejectCode: "constructor" }],
  ])("renders nothing for %s", (_label, extra) => {
    const { toJSON } = renderExtra(extra);

    expect(toJSON()).toBeNull();
  });

  // Guards the cost of overriding the generic renderer, which printed every key.
  it("ignores a field it does not handle", () => {
    const { toJSON } = renderExtra({ somethingNew: "value" });

    expect(toJSON()).toBeNull();
  });
});
