/**
 * @jest-environment jsdom
 */
import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import {
  createMockAccount,
  createMockCurrency,
} from "../../__integrations__/__fixtures__/accounts";
import { AddressMatchedSection } from "../AddressMatchedSection";

const FIXED_NOW = new Date("2026-07-31T10:00:00.000Z");
const address = "0x95f98055ag77xe7csuz15e36";
const formattedAddress = "0x95f980...suz15e36";

function renderAddressMatchedSection(
  searchResult: AddressSearchResult,
  options?: {
    featureFlagOverrides?: Parameters<typeof withFlagOverrides>[0];
  },
) {
  return render(
    <AddressMatchedSection
      searchResult={searchResult}
      searchValue={address}
      onSelect={jest.fn()}
      isAddressComplete
    />,
    options?.featureFlagOverrides
      ? { initialState: withFlagOverrides(options.featureFlagOverrides) }
      : undefined,
  );
}

describe("AddressMatchedSection", () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("displays the matched account name with the already used subtitle", () => {
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
        lastUsedAt: new Date("2026-07-31T09:57:00.000Z"),
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
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult);

    expect(screen.getByTestId("send-address-matched-title")).toHaveTextContent("Address matched");
    expect(screen.getByText("Send to Ethereum 2")).toBeInTheDocument();
    expect(screen.getByText("Already used · 3 min ago")).toBeInTheDocument();
  });

  it("displays the formatted address subtitle when the matched account was not already used", () => {
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
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult);

    expect(screen.getByText("Send to Ethereum 2")).toBeInTheDocument();
    expect(screen.getByText(formattedAddress)).toBeInTheDocument();
  });

  it("does not display the first interaction banner when the feature flag is disabled", () => {
    const searchResult: AddressSearchResult = {
      status: "valid",
      error: null,
      resolvedAddress: address,
      ensName: undefined,
      isLedgerAccount: false,
      accountName: undefined,
      accountBalance: undefined,
      accountBalanceFormatted: undefined,
      isFirstInteraction: true,
      matchedRecentAddress: undefined,
      matchedAccounts: [],
      bridgeErrors: undefined,
      bridgeWarnings: undefined,
      hasBridgeValidationResult: true,
    };

    renderAddressMatchedSection(searchResult, {
      featureFlagOverrides: { newSendFlowFirstInteractionBanner: { enabled: false } },
    });

    expect(screen.queryByTestId("send-recent-history-warning")).not.toBeInTheDocument();
  });
});
