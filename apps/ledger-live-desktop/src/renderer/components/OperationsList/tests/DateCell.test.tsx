import React from "react";
import { useTranslation } from "react-i18next";
import { render, screen } from "tests/testSetup";
import type { Operation } from "@ledgerhq/types-live";
import DateCell from "../DateCell";

const makeOperation = (overrides: Partial<Operation> = {}): Operation =>
  ({
    id: "op-1",
    type: "UNSTAKE",
    hasFailed: false,
    date: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  }) as Operation;

const DateCellHarness = ({ operation, family }: { operation: Operation; family?: string }) => {
  const { t } = useTranslation();
  return <DateCell t={t} operation={operation} family={family} />;
};

describe("OperationsList/DateCell", () => {
  it("uses the family-scoped label when the family overrides the operation type", () => {
    render(<DateCellHarness operation={makeOperation()} family="tezos" />);
    expect(screen.getByText("Unstaking")).toBeInTheDocument();
  });

  it("falls back to the shared label for families without an override", () => {
    render(<DateCellHarness operation={makeOperation()} family="aptos" />);
    expect(screen.getByText("Unstaked")).toBeInTheDocument();
  });

  it("falls back to the shared label when no family is provided", () => {
    render(<DateCellHarness operation={makeOperation()} />);
    expect(screen.getByText("Unstaked")).toBeInTheDocument();
  });

  it("shows the failed label for failed operations", () => {
    render(<DateCellHarness operation={makeOperation({ hasFailed: true })} family="tezos" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });
});
