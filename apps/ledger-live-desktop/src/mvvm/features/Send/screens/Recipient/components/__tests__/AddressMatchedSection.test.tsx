/**
 * @jest-environment jsdom
 */
import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import React from "react";
import { render, screen } from "tests/testSetup";
import {
  createMockAccount,
  createMockCurrency,
} from "../../__integrations__/__fixtures__/accounts";
import { AddressMatchedSection } from "../AddressMatchedSection";

jest.mock("@ledgerhq/live-common/utils/addressUtils", () => ({
  formatAddress: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  ...jest.requireActual("react-i18next"),
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) => {
      if (key === "newSendFlow.addressMatched") return "Address matched";
      if (key === "newSendFlow.sendTo") return `Send to ${values?.address}`;
      if (key === "newSendFlow.alreadyUsed") return `Already used · ${values?.date}`;
      return key;
    },
  }),
}));

jest.mock("../../hooks/useFormatRelativeDate", () => ({
  useFormatRelativeDate: () => () => "3 min ago",
}));

jest.mock("@ledgerhq/lumen-ui-react", () => {
  return {
    ...jest.requireActual("@ledgerhq/lumen-ui-react"),
    ListItem: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
    ListItemContent: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    ListItemDescription: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    ListItemLeading: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    ListItemTitle: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    ListItemTrailing: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    Spot: () => <div />,
    Subheader: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    SubheaderRow: ({ children }: React.PropsWithChildren) => <div>{children}</div>,
    SubheaderTitle: ({
      children,
      ...props
    }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
      <div {...props}>{children}</div>
    ),
  };
});

jest.mock("@ledgerhq/lumen-ui-react/symbols", () => ({
  ChevronRight: () => <span />,
  LedgerLogo: () => null,
  Wallet: () => null,
}));

const mockedFormatAddress = jest.mocked(formatAddress);

describe("AddressMatchedSection", () => {
  it("displays the matched account name with the already used subtitle", () => {
    const address = "0x95f98055ag77xe7csuz15e36";
    mockedFormatAddress.mockReturnValue("0x95f...15e36");

    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: true,
      accountName: "Ethereum 2",
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: {
        address,
        currency: createMockCurrency({ id: "ethereum", name: "Ethereum", ticker: "ETH" }),
        lastUsedAt: new Date("2026-03-01T10:00:00.000Z"),
        name: address,
        isLedgerAccount: true,
        accountId: "account_2",
      },
      matchedAccounts: [
        {
          account: createMockAccount({ id: "account_2", freshAddress: address }),
          accountName: undefined,
          accountBalance: undefined,
          accountBalanceFormatted: undefined,
        },
      ],
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
    };

    render(
      <AddressMatchedSection
        searchResult={searchResult}
        searchValue={address}
        onSelect={jest.fn()}
        isAddressComplete
      />,
    );

    expect(screen.getByText("Address matched")).toBeInTheDocument();
    expect(screen.getByText("Send to Ethereum 2")).toBeInTheDocument();
    expect(screen.getByText("Already used · 3 min ago")).toBeInTheDocument();
  });

  it("displays the formatted address subtitle when the matched account was not already used", () => {
    const address = "0x95f98055ag77xe7csuz15e36";
    mockedFormatAddress.mockReturnValue("0x95f...15e36");

    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: true,
      accountName: "Ethereum 2",
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: false,
      matchedRecentAddress: undefined,
      matchedAccounts: [
        {
          account: createMockAccount({ id: "account_2", freshAddress: address }),
          accountName: undefined,
          accountBalance: undefined,
          accountBalanceFormatted: undefined,
        },
      ],
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
    };

    render(
      <AddressMatchedSection
        searchResult={searchResult}
        searchValue={address}
        onSelect={jest.fn()}
        isAddressComplete
      />,
    );

    expect(screen.getByText("Send to Ethereum 2")).toBeInTheDocument();
    expect(screen.getByText("0x95f...15e36")).toBeInTheDocument();
  });
});
