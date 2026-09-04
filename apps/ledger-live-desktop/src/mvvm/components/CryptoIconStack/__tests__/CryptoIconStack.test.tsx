import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";
import { render, screen } from "tests/testSetup";
import { CryptoIconStack } from "../index";

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: jest.fn(({ ledgerId, ticker }) => (
    <span data-testid={`crypto-icon-${ledgerId}`}>{ticker}</span>
  )),
}));

const mockedCryptoIcon = jest.mocked(CryptoIcon);

const ethereum = { ledgerId: "ethereum", ticker: "ETH" };
const bitcoin = { ledgerId: "bitcoin", ticker: "BTC" };

describe("CryptoIconStack", () => {
  beforeEach(() => {
    mockedCryptoIcon.mockClear();
  });

  it("should render nothing when there are no items", () => {
    const { container } = render(<CryptoIconStack size={24} items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("should render a CryptoIcon for each item", () => {
    render(
      <CryptoIconStack
        size={24}
        items={[ethereum, bitcoin]}
        testID="crypto-icon-stack"
        overflowTestID="crypto-icon-stack-overflow"
      />,
    );

    expect(screen.getByTestId("crypto-icon-ethereum")).toBeVisible();
    expect(screen.getByTestId("crypto-icon-bitcoin")).toBeVisible();
    expect(mockedCryptoIcon).toHaveBeenCalledWith(
      expect.objectContaining({ ledgerId: "ethereum", ticker: "ETH", size: 24 }),
      undefined,
    );
  });

  it("should show a tooltip with all tickers on hover", async () => {
    const { user } = render(
      <CryptoIconStack size={24} items={[ethereum, bitcoin]} testID="crypto-icon-stack" />,
    );

    await user.hover(screen.getByTestId("crypto-icon-stack"));

    expect(await screen.findByRole("tooltip", { name: "ETH, BTC" })).toBeVisible();
  });
});
