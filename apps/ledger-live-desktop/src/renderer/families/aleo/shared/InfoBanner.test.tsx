import React from "react";
import { render, screen } from "tests/testSetup";
import { MAX_PRIVATE_RECORDS_PER_TRANSACTION } from "@ledgerhq/live-common/families/aleo/constants";
import InfoBanner from "./InfoBanner";

jest.mock("~/renderer/components/Alert", () => ({
  __esModule: true,
  default: ({
    children,
    learnMoreUrl,
  }: {
    children: React.ReactNode;
    learnMoreUrl?: string;
    learnMoreOnRight?: boolean;
    small?: boolean;
    type?: string;
  }) => (
    <div data-testid="alert">
      {learnMoreUrl && <a href={learnMoreUrl} data-testid="learn-more-link" />}
      {children}
    </div>
  ),
}));

describe("InfoBanner", () => {
  it("renders without crashing", () => {
    render(<InfoBanner />);

    expect(screen.getByTestId("alert")).toBeInTheDocument();
  });

  it("renders part one description text", () => {
    render(<InfoBanner />);

    expect(screen.getByText("Sender, amount and recipient hidden on-chain.")).toBeInTheDocument();
  });

  it("renders max records count from constants", () => {
    render(<InfoBanner />);

    // The translated string for descPartTwo includes the MAX_PRIVATE_RECORDS_PER_TRANSACTION value
    expect(
      screen.getByText(new RegExp(String(MAX_PRIVATE_RECORDS_PER_TRANSACTION))),
    ).toBeInTheDocument();
  });

  it("renders a learn-more link pointing to the maxSpendable url", () => {
    render(<InfoBanner />);

    const link = screen.getByTestId("learn-more-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href");
  });
});
