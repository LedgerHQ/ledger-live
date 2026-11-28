import React from "react";
import type { Operation } from "@ledgerhq/types-live";
import { render, screen } from "@tests/test-renderer";
import operationDetails from "../operationDetails";

const { OperationDetailsExtra } = operationDetails;

const SYNCED_EXTRA = {
  uid: "0344dc18c2e3d367123a9663b1f902a0597ff7760af5e7690732dd0e63b22b80",
  instrumentId: "Amulet",
  instrumentAdmin: "DSO::1220abcdef",
};

const renderExtra = (extra: unknown) =>
  render(<OperationDetailsExtra operation={{ extra } as unknown as Operation} />);

describe("canton OperationDetailsExtra", () => {
  it("shows the memo", () => {
    renderExtra({ ...SYNCED_EXTRA, memo: "invoice 41" });

    expect(screen.getByText("Memo")).toBeOnTheScreen();
    expect(screen.getByText("invoice 41")).toBeOnTheScreen();
  });

  it("hides the internal fields", () => {
    renderExtra({ ...SYNCED_EXTRA, memo: "invoice 41" });

    expect(screen.queryByText(/operationDetails\.extra/)).toBeNull();
    expect(screen.queryByText(SYNCED_EXTRA.uid)).toBeNull();
    expect(screen.queryByText(SYNCED_EXTRA.instrumentId)).toBeNull();
    expect(screen.queryByText(SYNCED_EXTRA.instrumentAdmin)).toBeNull();
  });

  it.each([
    ["an undefined memo", { ...SYNCED_EXTRA, memo: undefined }],
    ["no memo key", SYNCED_EXTRA],
    ["an empty memo", { ...SYNCED_EXTRA, memo: "" }],
    ["a non-string memo", { ...SYNCED_EXTRA, memo: 7 }],
    ["extra absent altogether", undefined],
    ["a null extra", null],
  ])("renders nothing for %s", (_label, extra) => {
    const { toJSON } = renderExtra(extra);

    expect(toJSON()).toBeNull();
  });
});
