import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import React from "react";
import { render, screen } from "@testing-library/react-native";
import { AddressMatchedSection } from "../AddressMatchedSection";

jest.mock("@features/platform-feature-flags", () => ({
  useFeature: () => ({ enabled: false }),
}));

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, values?: Record<string, string>) =>
      values ? `${key} ${JSON.stringify(values)}` : key,
  }),
}));

jest.mock("~/context/hooks", () => ({
  useSelector: () => "en",
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const Container = ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>;
  const Label = ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>;

  return {
    Banner: Container,
    BottomSheet: Container,
    BottomSheetHeader: () => null,
    BottomSheetView: Container,
    Box: Container,
    Button: ({ children, onPress }: { children: React.ReactNode; onPress: () => void }) => (
      <RN.Pressable onPress={onPress}>
        <RN.Text>{children}</RN.Text>
      </RN.Pressable>
    ),
    ListItem: ({
      children,
      onPress,
      testID,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      testID?: string;
    }) => (
      <RN.Pressable onPress={onPress} testID={testID}>
        {children}
      </RN.Pressable>
    ),
    ListItemContent: Container,
    ListItemDescription: Label,
    ListItemLeading: Container,
    ListItemTitle: Label,
    ListItemTrailing: Container,
    Spot: () => null,
    Subheader: Container,
    SubheaderRow: Container,
    SubheaderTitle: Label,
    Text: Label,
    useBottomSheetRef: () => ({ current: { present: jest.fn() } }),
  };
});

jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => ({
  ChevronRight: () => null,
  LedgerLogo: () => null,
  Wallet: () => null,
}));

const address = "0x95f98055ag77xe7csuz15e36";

const searchResult: AddressSearchResult = {
  status: "valid",
  error: null,
  resolvedAddress: undefined,
  ensName: undefined,
  isLedgerAccount: false,
  accountName: undefined,
  accountBalance: undefined,
  accountBalanceFormatted: undefined,
  isFirstInteraction: false,
  matchedRecentAddress: undefined,
  matchedAccounts: [],
  matchedContact: undefined,
  bridgeErrors: undefined,
  bridgeWarnings: undefined,
  hasBridgeValidationResult: true,
};

describe("AddressMatchedSection", () => {
  it("shows a valid unmatched address selected by the shared presentation", () => {
    render(
      <AddressMatchedSection
        searchResult={searchResult}
        searchValue={address}
        onSelect={jest.fn()}
        isAddressComplete
      />,
    );

    expect(screen.getByTestId("new-send-flow-address-confirm")).toBeVisible();
  });
});
