import type { Portfolio } from "@domain/api-account-portfolio";
import {
  MOCK_EVM_ADDRESS,
  mockAddressDescriptor,
  mockBalanceEntry,
  mockBalanceGroup,
  mockUtxoDescriptor,
} from "@domain/api-account-portfolio/mock/portfolio-api";
import { computeAccountUUID, type AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  isPortfolioSyncing,
  portfolioServiceAccounts,
  portfolioTotal,
  walletRegistrations,
  type PortfolioWalletAccount,
} from "./portfolioAccounts";

const XPUB_A = `xpub${"a".repeat(107)}`;
const XPUB_B = `xpub${"b".repeat(107)}`;

const evm = mockAddressDescriptor();
const utxo = (xpub: string, index: number) =>
  mockUtxoDescriptor(xpub, "bitcoin", `m/84h/0h/${index}h`);
const wallet = (
  descriptor: AccountDescriptor,
  addresses: string[] = [],
): PortfolioWalletAccount => ({
  accountUUID: computeAccountUUID(descriptor),
  descriptor,
  addresses,
});

describe("walletRegistrations", () => {
  it("counts the accounts no strategy covers", () => {
    const solana = mockAddressDescriptor("solana", "9xyz", "m/44h/501h/0h/0h");
    const result = walletRegistrations([wallet(evm), wallet(solana)]);
    expect(result.registrations).toEqual([{ type: "evm", address: MOCK_EVM_ADDRESS }]);
    expect(result.skippedCount).toBe(1);
  });
});

describe("portfolioServiceAccounts", () => {
  it("sums priced balances and keeps a failed account visible", () => {
    const portfolio: Portfolio = {
      id: "p1",
      accounts: [
        { id: "acc-eth", network: "ethereum", status: "synchronized" },
        { id: "acc-btc", network: "bitcoin", status: "uninitialized" },
      ],
    };
    const accounts = portfolioServiceAccounts(
      portfolio,
      [
        mockBalanceGroup("acc-eth", [
          mockBalanceEntry({}),
          mockBalanceEntry({
            asset: "usdc",
            ticker: "USDC",
            decimals: 6,
            amount: "2500000",
            currency_value: 2.5,
            status: "pending",
          }),
        ]),
        { type: "failure", network: "bitcoin", account_id: "acc-btc", error: "not indexed" },
      ],
      [],
    );
    expect(accounts[0]?.value).toBe(3002.5);
    expect(accounts[0]?.balances.map(line => [line.ticker, line.pending])).toEqual([
      ["ETH", false],
      ["USDC", true],
    ]);
    expect(accounts[1]).toMatchObject({ error: "not indexed", value: null });
    expect(portfolioTotal(accounts)).toBe(3002.5);
  });

  it("counts a balance once when the service repeats it as pending", () => {
    const portfolio: Portfolio = {
      id: "p1",
      accounts: [{ id: "acc-eth", network: "ethereum", status: "synchronized" }],
    };
    const accounts = portfolioServiceAccounts(
      portfolio,
      [
        mockBalanceGroup("acc-eth", [
          mockBalanceEntry({}),
          mockBalanceEntry({ status: "pending" }),
        ]),
      ],
      [],
    );
    expect(accounts[0]?.balances).toHaveLength(1);
    expect(accounts[0]?.balances[0]?.pending).toBe(false);
    expect(portfolioTotal(accounts)).toBe(3000);
  });

  it("ties an account to the wallet through its registration", () => {
    const btc = wallet(utxo(XPUB_A, 0));
    const portfolio: Portfolio = {
      id: "p1",
      registrations: [{ id: "svc-btc", type: "auto_derive", network: "bitcoin", xpub: XPUB_A }],
      accounts: [{ id: "svc-btc", network: "bitcoin", status: "synchronized" }],
    };
    expect(portfolioServiceAccounts(portfolio, [], [btc])[0]?.accountUUID).toBe(btc.accountUUID);
  });

  it("ties an account to the wallet through an address in its id", () => {
    const eth = wallet(evm);
    const portfolio: Portfolio = {
      id: "p1",
      accounts: [
        {
          id: `ethereum:${MOCK_EVM_ADDRESS.toUpperCase().replace("0X", "0x")}`,
          network: "ethereum",
          status: "synchronized",
        },
      ],
    };
    expect(portfolioServiceAccounts(portfolio, [], [eth])[0]?.accountUUID).toBe(eth.accountUUID);
  });

  it("never assigns an owner from a balance", () => {
    const first = wallet(utxo(XPUB_A, 0));
    const second = wallet(utxo(XPUB_B, 1));
    const portfolio: Portfolio = {
      id: "p1",
      accounts: [
        { id: "svc-1", network: "bitcoin", status: "synchronized" },
        { id: "svc-2", network: "bitcoin", status: "synchronized" },
      ],
    };
    const btc = (amount: string) =>
      mockBalanceEntry({
        network: "bitcoin",
        asset: "bitcoin",
        ticker: "BTC",
        decimals: 8,
        amount,
      });
    const accounts = portfolioServiceAccounts(
      portfolio,
      [mockBalanceGroup("svc-1", [btc("200")]), mockBalanceGroup("svc-2", [btc("100")])],
      [first, second],
    );
    expect(accounts.map(account => account.accountUUID)).toEqual([undefined, undefined]);
  });
});

describe("isPortfolioSyncing", () => {
  it("polls until every registered account is settled", () => {
    expect(isPortfolioSyncing({ id: "p1", accounts: [] }, 1)).toBe(true);
    expect(
      isPortfolioSyncing(
        { id: "p1", accounts: [{ id: "a", network: "bitcoin", status: "uninitialized" }] },
        1,
      ),
    ).toBe(true);
    expect(
      isPortfolioSyncing(
        {
          id: "p1",
          accounts: [
            { id: "a", network: "bitcoin", status: "synchronized" },
            { id: "b", network: "ethereum", status: "registration_failure" },
          ],
        },
        2,
      ),
    ).toBe(false);
    expect(isPortfolioSyncing({ id: "p1" }, 0)).toBe(false);
  });
});
