import React from "react";
import { render, screen } from "tests/testSetup";
import {
  MAX_PRIVATE_RECORDS_PER_TRANSACTION,
  MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION,
} from "@ledgerhq/live-common/families/aleo/constants";
import { ALEO_MAIN_ACCOUNT, makeTokenAccount } from "../__mocks__/account.mock";
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
    render(<InfoBanner account={ALEO_MAIN_ACCOUNT} />);

    expect(screen.getByTestId("alert")).toBeInTheDocument();
  });

  it("renders part one description text", () => {
    render(<InfoBanner account={ALEO_MAIN_ACCOUNT} />);

    expect(screen.getByText("Sender, amount and recipient hidden on-chain.")).toBeInTheDocument();
  });

  it("renders coin account max records count", () => {
    render(<InfoBanner account={ALEO_MAIN_ACCOUNT} />);

    expect(
      screen.getByText(new RegExp(String(MAX_PRIVATE_RECORDS_PER_TRANSACTION))),
    ).toBeInTheDocument();
  });

  it("renders token account max records count", () => {
    render(<InfoBanner account={makeTokenAccount([])} />);

    expect(
      screen.getByText(new RegExp(String(MAX_PRIVATE_TOKEN_RECORDS_PER_TRANSACTION))),
    ).toBeInTheDocument();
  });

  it("renders a learn-more link pointing to the maxSpendable url", () => {
    render(<InfoBanner account={ALEO_MAIN_ACCOUNT} />);

    const link = screen.getByTestId("learn-more-link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href");
  });
});
