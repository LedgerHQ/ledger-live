import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { Operation } from "@ledgerhq/types-live";
import OperationDetailsExtra from "./Extra";

describe("OperationDetailsExtra", () => {
  it("should display user-facing fields without exposing internal input references", () => {
    const operation = {
      extra: {
        inputs: ["input-hash-0"],
        inputRefs: [{ hash: "input-hash", outputIndex: 0, address: "input-address" }],
      },
    } as unknown as Operation;

    render(<OperationDetailsExtra operation={operation} />);

    expect(screen.getByText("Inputs")).toBeOnTheScreen();
    expect(screen.getByText("input-hash-0")).toBeOnTheScreen();
    expect(screen.queryByText("operationDetails.extra.inputRefs")).not.toBeOnTheScreen();
    expect(screen.queryByText("[object Object]")).not.toBeOnTheScreen();
  });
});
