import React from "react";
import { render, screen } from "@testing-library/react";
import { CardVisual } from "./CardVisual";
import type { FormattedValue } from "../../types";

jest.mock("@domain/api-card-management", () => ({
  useGetCardStatusQuery: jest.fn(),
}));

import { useGetCardStatusQuery, type PayCardStatus } from "@domain/api-card-management";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

function renderWithStatus(status: PayCardStatus["status"] | undefined) {
  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    data: status
      ? { id: "card-id", panLast4: "1234", status, type: "VIRTUAL" as const, orderedAt: "" }
      : undefined,
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);

  return render(
    <CardVisual balance={100} formatCountervalue={formatCountervalue} balanceLabel="Balance" />,
  );
}

describe("CardVisual (web)", () => {
  it("renders the card face with the balance caption and amount", () => {
    renderWithStatus("ACTIVE");

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByTestId("card-artwork")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByTestId("card-visual-amount")).toBeVisible();
  });

  it("shows the frozen marker once the card status reads FROZEN", () => {
    renderWithStatus("FROZEN");

    expect(screen.getByTestId("card-visual-frozen")).toBeVisible();
  });

  it.each<PayCardStatus["status"] | undefined>(["ACTIVE", "BLOCKED", undefined])(
    "leaves the card unmarked on status %s",
    status => {
      renderWithStatus(status);

      expect(screen.queryByTestId("card-visual-frozen")).not.toBeInTheDocument();
    },
  );
});
