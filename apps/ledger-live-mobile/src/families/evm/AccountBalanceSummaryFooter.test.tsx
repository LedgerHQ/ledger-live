import React from "react";
import { render, withFlagOverrides } from "@tests/test-renderer";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/index";
import type { TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { TokenAccount } from "@ledgerhq/types-live";
import AccountBalanceFooter from "./AccountBalanceSummaryFooter";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn().mockReturnValue({}),
}));

const ethereum = getCryptoCurrencyById("ethereum");
const usdt = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usdt",
  name: "Tether USD",
  ticker: "USDT",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  decimals: 6,
  units: [
    {
      name: "USDT",
      code: "USDT",
      magnitude: 6,
    },
  ],
  tokenType: "erc20",
  parentCurrency: ethereum,
} as unknown as TokenCurrency;

const ethAccount = genAccount("test-eth", { currency: ethereum, subAccountsCount: 0 });
const usdtAccount: TokenAccount = genTokenAccount(0, ethAccount, usdt);

const withEvmStakingEnabled = withFlagOverrides({
  evmNativeStaking: { enabled: true, params: { supportedCurrencyIds: ["ethereum"] } },
});

describe("AccountBalanceFooter", () => {
  it("should render null without crashing when given a TokenAccount", () => {
    // Regression test: previously crashed with "Cannot read property 'id' of undefined"
    // because account.currency.id was accessed before the account.type !== "Account" guard
    const { toJSON } = render(<AccountBalanceFooter account={usdtAccount} />, {
      overrideInitialState: withEvmStakingEnabled,
    });
    expect(toJSON()).toBeNull();
  });

  it("should render null for a non-ethereum Account (unsupported currency)", () => {
    const bitcoin = getCryptoCurrencyById("bitcoin");
    const btcAccount = genAccount("test-btc", { currency: bitcoin, subAccountsCount: 0 });
    const { toJSON } = render(<AccountBalanceFooter account={btcAccount} />, {
      overrideInitialState: withEvmStakingEnabled,
    });
    expect(toJSON()).toBeNull();
  });

  it("should render null when evmNativeStaking is disabled", () => {
    const { toJSON } = render(<AccountBalanceFooter account={ethAccount} />, {
      overrideInitialState: withFlagOverrides({ evmNativeStaking: { enabled: false } }),
    });
    expect(toJSON()).toBeNull();
  });
});
