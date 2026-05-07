import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { render, screen } from "tests/testSetup";
import TransactionalIcon from "../index";

const bitcoin = getCryptoCurrencyById("bitcoin");

describe("TransactionalIcon", () => {
  it("should render dot wrapper when operation type has a transactional dot config", () => {
    render(
      <TransactionalIcon operationType="IN" isPending={false} currency={bitcoin} mediaSize={48} />,
    );

    expect(screen.getByTestId("transactional-icon-dot-IN")).toBeVisible();
  });

  it("should not render dot wrapper when operation type has no dot config", () => {
    render(<TransactionalIcon operationType="NONE" isPending={false} currency={bitcoin} />);

    expect(screen.queryByTestId("transactional-icon-dot-NONE")).toBeNull();
  });

  it("should render dot wrapper when pending regardless of operation type", () => {
    render(<TransactionalIcon operationType="NONE" isPending currency={bitcoin} />);

    expect(screen.getByTestId("transactional-icon-dot-NONE")).toBeVisible();
  });

  it("should render dot wrapper when hasFailed regardless of operation type", () => {
    render(
      <TransactionalIcon operationType="NONE" isPending={false} hasFailed currency={bitcoin} />,
    );

    expect(screen.getByTestId("transactional-icon-dot-NONE")).toBeVisible();
  });
});
