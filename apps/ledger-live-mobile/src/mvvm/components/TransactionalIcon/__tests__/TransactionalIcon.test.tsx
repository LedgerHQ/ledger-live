import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import { render, screen } from "@tests/test-renderer";
import TransactionalIcon from "../index";

const bitcoin = getCryptoCurrencyById("bitcoin");

describe("TransactionalIcon", () => {
  it("should render dot wrapper and crypto icon when operation type has a transactional dot config", () => {
    render(
      <TransactionalIcon operationType="IN" isPending={false} currency={bitcoin} mediaSize={48} />,
    );

    expect(screen.getByTestId(`transactional-icon-dot-IN`)).toBeVisible();
    expect(screen.getByTestId(`transactional-icon-crypto-bitcoin`)).toBeVisible();
  });

  it("should render only crypto icon when operation type has no dot config", () => {
    render(<TransactionalIcon operationType="NONE" isPending={false} currency={bitcoin} />);

    expect(screen.queryByTestId(`transactional-icon-dot-NONE`)).toBeNull();
    expect(screen.getByTestId(`transactional-icon-crypto-bitcoin`)).toBeVisible();
  });

  it("should render dot wrapper and crypto icon when pending regardless of operation type", () => {
    render(<TransactionalIcon operationType="NONE" isPending currency={bitcoin} />);

    expect(screen.getByTestId(`transactional-icon-dot-NONE`)).toBeVisible();
    expect(screen.getByTestId(`transactional-icon-crypto-bitcoin`)).toBeVisible();
  });

  it("should render dot wrapper when hasFailed regardless of operation type", () => {
    render(
      <TransactionalIcon operationType="NONE" isPending={false} hasFailed currency={bitcoin} />,
    );

    expect(screen.getByTestId(`transactional-icon-dot-NONE`)).toBeVisible();
    expect(screen.getByTestId(`transactional-icon-crypto-bitcoin`)).toBeVisible();
  });
});
