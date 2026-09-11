import React from "react";
import { render, screen } from "@testing-library/react-native";
import { I18nWrapper } from "../../__tests__/i18nWrapper";
import { CardVisual } from "./CardVisual";
import type { FormattedValue } from "../../types";

jest.mock("@domain/api-card-management", () => ({
  useGetCardStatusQuery: jest.fn(),
}));

import { useGetCardStatusQuery } from "@domain/api-card-management";

const formatCountervalue = (value: number): FormattedValue => ({
  integerPart: String(Math.trunc(value)),
  decimalPart: "00",
  currencyText: "$",
  decimalSeparator: ".",
  currencyPosition: "start",
});

function mockStatus(status?: string) {
  jest.mocked(useGetCardStatusQuery).mockReturnValue({
    data: status ? { status } : undefined,
  } as unknown as ReturnType<typeof useGetCardStatusQuery>);
}

function renderVisual() {
  return render(
    <CardVisual balance={100} formatCountervalue={formatCountervalue} balanceLabel="Balance" />,
    { wrapper: I18nWrapper },
  );
}

describe("CardVisual (native)", () => {
  it("renders the card face and the balance", () => {
    mockStatus("ACTIVE");
    renderVisual();

    expect(screen.getByTestId("card-visual")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.queryByTestId("card-visual-frozen")).toBeNull();
  });

  it("shows the frozen marker when the card status is frozen", () => {
    mockStatus("FROZEN");
    renderVisual();

    expect(screen.getByTestId("card-visual-frozen")).toBeVisible();
  });
});
