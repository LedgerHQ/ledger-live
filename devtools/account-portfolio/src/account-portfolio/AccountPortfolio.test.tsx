import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { AccountPortfolioResult, AccountPortfolioToolProps } from "../types";
import AccountPortfolio from "./AccountPortfolio";

jest.mock("@ledgerhq/crypto-icons", () => ({
  CryptoIcon: () => <span>icon</span>,
}));

const props = (overrides: Partial<AccountPortfolioToolProps> = {}): AccountPortfolioToolProps => ({
  accounts: [
    {
      accountUUID: "uuid-evm",
      label: "ethereum 0xabc",
      registration: '{"type":"evm","address":"0xabc"}',
    },
  ],
  defaultPortfolioId: "p1",
  serviceUrl: "https://portfolio.test",
  onRun: jest.fn<Promise<AccountPortfolioResult>, []>(() =>
    Promise.resolve({
      ok: true,
      durationMs: 12,
      sent: { method: "GET", url: "https://portfolio.test/v1/portfolio/p1/balance" },
      body: {},
      currency: "usd",
      view: {
        kind: "balance",
        hasMore: false,
        failures: [],
        entries: [
          {
            network: "ethereum",
            asset: "ethereum",
            amount: "1",
            decimals: 0,
            ticker: "ETH",
            name: "Ethereum",
            calId: "ethereum",
            currencyValue: 10,
            accountId: "base:0xabc",
            status: "confirmed",
            estimated: false,
            locked: false,
          },
        ],
      },
    }),
  ),
  ...overrides,
});

describe("AccountPortfolio", () => {
  it("shows the service and a balance once a read has run", async () => {
    const user = userEvent.setup();
    render(<AccountPortfolio {...props()} />);

    expect(screen.getByText("https://portfolio.test")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create portfolio" })).toBeVisible();

    await user.click(screen.getByRole("radio", { name: "Read" }));
    await user.click(screen.getByRole("button", { name: "Get balance" }));

    expect(screen.getByText("1 ETH")).toBeVisible();
    await user.click(screen.getByRole("radio", { name: /History/ }));
    expect(screen.getByText(/GET https:\/\/portfolio\.test/)).toBeVisible();
  });

  it("says when the service is off", () => {
    render(<AccountPortfolio {...props({ accounts: [], serviceUrl: "" })} />);
    expect(screen.getByRole("heading", { name: "Service disabled" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Create portfolio" })).toBeDisabled();
  });
});
