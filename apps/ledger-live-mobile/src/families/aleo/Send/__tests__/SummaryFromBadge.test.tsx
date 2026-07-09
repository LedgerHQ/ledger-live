import React from "react";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { render, screen } from "@tests/test-renderer";
import { SummaryFromBadge } from "../SummaryFromBadge";

describe("SummaryFromBadge", () => {
  it("renders null for non-aleo transaction", () => {
    const { toJSON } = render(
      <SummaryFromBadge transaction={{ family: "ethereum" } as Transaction} />,
    );

    expect(toJSON()).toBeNull();
  });

  it("shows Public for a public transaction", () => {
    render(
      <SummaryFromBadge transaction={{ family: "aleo", mode: "transfer_public" } as Transaction} />,
    );

    expect(screen.getByText("Public")).toBeOnTheScreen();
  });

  it("shows Private for a private transaction", () => {
    render(
      <SummaryFromBadge
        transaction={{ family: "aleo", mode: "transfer_private" } as Transaction}
      />,
    );

    expect(screen.getByText("Private")).toBeOnTheScreen();
  });
});
