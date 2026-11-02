import React from "react";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { TokenCurrency } from "@domain/entity-currency-token";
import { ArrowEvolutionUpMedium } from "@ledgerhq/native-ui/assets/icons";
import type { ValueChange } from "@ledgerhq/types-live";
import { render, screen } from "@tests/test-renderer";
import { useBalanceHistoryWithCountervalue } from "~/hooks/portfolio";
import SubAccountRow from "../SubAccountRow";

jest.mock("~/hooks/portfolio", () => ({
  useBalanceHistoryWithCountervalue: jest.fn(),
}));

const mockUseBalanceHistoryWithCountervalue = jest.mocked(useBalanceHistoryWithCountervalue);

const ethereum = getCryptoCurrencyById("ethereum");
const usdt = {
  type: "TokenCurrency",
  id: "ethereum/erc20/usd_tether__erc20_",
  parentCurrencyId: ethereum.id,
  tokenType: "erc20",
  contractAddress: "0xdac17f958d2ee523a2206206994597c13d831ec7",
  ticker: "USDT",
  name: "Tether USD",
  units: [{ name: "Tether USD", code: "USDT", magnitude: 6 }],
} as unknown as TokenCurrency;

const parentAccount = genAccount("sub-account-row-parent", { currency: ethereum });
const tokenAccount = genTokenAccount(0, parentAccount, usdt);

const mockChanges = (countervalueChange: ValueChange, cryptoChange: ValueChange) =>
  mockUseBalanceHistoryWithCountervalue.mockReturnValue({
    history: [],
    countervalueAvailable: true,
    countervalueReceiveSum: 0,
    countervalueSendSum: 0,
    countervalueChange,
    cryptoChange,
  });

const renderRow = (useCounterValue: boolean) =>
  render(
    <SubAccountRow
      account={tokenAccount}
      parentAccount={parentAccount}
      onSubAccountPress={jest.fn()}
      onSubAccountLongPress={jest.fn()}
      useCounterValue={useCounterValue}
      testID="sub-account-row"
    />,
  );

describe("SubAccountRow", () => {
  it("shows the variation with its arrow when the percentage is known", () => {
    mockChanges({ value: 12, percentage: 0.0123 }, { value: 12, percentage: null });

    renderRow(true);

    expect(screen.getByText("1.23%")).toBeVisible();
    expect(screen.UNSAFE_queryByType(ArrowEvolutionUpMedium)).not.toBeNull();
  });

  it("hides the arrow when the countervalue change has no percentage", () => {
    mockChanges({ value: 12, percentage: undefined }, { value: 12, percentage: null });

    renderRow(true);

    expect(screen.UNSAFE_queryByType(ArrowEvolutionUpMedium)).toBeNull();
    expect(screen.queryByText(/%$/)).toBeNull();
  });

  it("hides the arrow for the crypto change, which never has a percentage", () => {
    mockChanges({ value: 12, percentage: 0.0123 }, { value: 12, percentage: null });

    renderRow(false);

    expect(screen.UNSAFE_queryByType(ArrowEvolutionUpMedium)).toBeNull();
  });
});
