import React from "react";
import { render, screen } from "@testing-library/react-native";
import AccountBalanceFooter from "../AccountBalanceSummaryFooter";
import { createMockMinaAccount, createDelegatingMinaAccount, mockValidators } from "./testUtils";
import { View, Text as RNText } from "react-native";

jest.mock(
  "@ledgerhq/native-ui/pre-ldls",
  () => ({
    CryptoIcon: () => null,
  }),
  { virtual: true },
);

jest.mock("~/modals/Info", () => {
  return {
    __esModule: true,
    default: function MockInfoModal() {
      return React.createElement(View);
    },
  };
});

jest.mock("~/components/BalanceSummaryInfoItem", () => {
  return {
    __esModule: true,
    default: function MockInfoItem({ title, value }: { title: string; value: React.ReactNode }) {
      return React.createElement(
        View,
        null,
        React.createElement(RNText, null, title),
        typeof value === "string" ? React.createElement(RNText, null, value) : value,
      );
    },
  };
});

jest.mock("~/components/CurrencyUnitValue", () => {
  return {
    __esModule: true,
    default: function MockCurrencyUnitValue({ value }: { value: { toString: () => string } }) {
      return React.createElement(RNText, null, `${value.toString()} MINA`);
    },
  };
});

jest.mock("LLM/hooks/useAccountUnit", () => ({
  useAccountUnit: () => ({ name: "MINA", code: "MINA", magnitude: 9 }),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "mina.summaryFooter.delegatedTo": "Delegated to",
        "mina.summaryFooter.stakedBalance": "Staked Balance",
        "mina.summaryFooter.producerAddress": "Producer Address",
        "mina.summaryFooter.delegatedToTooltip": "Name of the block producer",
        "mina.summaryFooter.stakedBalanceTooltip": "Total amount staked",
        "mina.summaryFooter.producerAddressTooltip": "Public address of producer",
      };
      return translations[key] || key;
    },
  }),
}));

describe("AccountBalanceSummaryFooter", () => {
  it("renders nothing when account has no delegation", () => {
    const account = createMockMinaAccount();
    const { toJSON } = render(<AccountBalanceFooter account={account} />);
    expect(toJSON()).toBeNull();
  });

  it("renders nothing when account type is not Account", () => {
    const account = createMockMinaAccount({ type: "TokenAccount" as "Account" });
    const { toJSON } = render(<AccountBalanceFooter account={account} />);
    expect(toJSON()).toBeNull();
  });

  it("renders delegation info when account has active delegation", () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);
    render(<AccountBalanceFooter account={account} />);

    expect(screen.getByText("Delegated to")).toBeOnTheScreen();
    expect(screen.getByText("Staked Balance")).toBeOnTheScreen();
    expect(screen.getByText("Producer Address")).toBeOnTheScreen();
  });

  it("displays the validator identity name", () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);
    render(<AccountBalanceFooter account={account} />);

    expect(screen.getByText(mockValidators[0].identityName)).toBeOnTheScreen();
  });

  it("displays the producer address", () => {
    const account = createDelegatingMinaAccount(mockValidators[0]);
    render(<AccountBalanceFooter account={account} />);

    expect(screen.getByText(mockValidators[0].address)).toBeOnTheScreen();
  });
});
