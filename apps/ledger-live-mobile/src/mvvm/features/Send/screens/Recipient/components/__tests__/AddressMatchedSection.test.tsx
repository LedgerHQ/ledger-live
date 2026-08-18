import type { AddressSearchResult } from "@ledgerhq/live-common/flows/send/recipient/types";
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AddressMatchedSection } from "../AddressMatchedSection";
import { useAddressMatchedSectionViewModel } from "../../hooks/useAddressMatchedSectionViewModel";

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

jest.mock("@features/platform-contacts/native", () => ({
  ContactAvatar: ({ name, testID }: { name: string; testID?: string }) => {
    const RN = jest.requireActual<typeof import("react-native")>("react-native");
    return <RN.Text testID={testID}>{name}</RN.Text>;
  },
}));

jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const Container = ({ children, testID }: { children?: React.ReactNode; testID?: string }) => (
    <RN.View testID={testID}>{children}</RN.View>
  );
  const Label = ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>;

  return {
    Banner: Container,
    BottomSheet: Container,
    BottomSheetHeader: () => null,
    BottomSheetView: Container,
    Box: Container,
    Button: ({
      children,
      onPress,
      testID,
      disabled,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      testID?: string;
      disabled?: boolean;
    }) => (
      <RN.Pressable onPress={onPress} testID={testID} disabled={disabled}>
        <RN.Text>{children}</RN.Text>
      </RN.Pressable>
    ),
    Card: Container,
    CardContent: Container,
    CardContentDescription: Label,
    CardContentTitle: Label,
    CardHeader: Container,
    CardLeading: Container,
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

function AddressMatchedSectionContainer({
  result,
  isContactsFeatureEnabled = false,
  onSelect = jest.fn(),
}: Readonly<{
  result: AddressSearchResult;
  isContactsFeatureEnabled?: boolean;
  onSelect?: (address: string, ensName?: string) => void;
}>) {
  const viewModel = useAddressMatchedSectionViewModel({
    searchResult: result,
    searchValue: address,
    onSelect,
    isAddressComplete: true,
    isContactsFeatureEnabled,
  });

  return <AddressMatchedSection viewModel={viewModel} />;
}

describe("AddressMatchedSection", () => {
  it("shows a valid unmatched address selected by the shared presentation", () => {
    render(<AddressMatchedSectionContainer result={searchResult} />);

    expect(screen.getByTestId("new-send-flow-address-confirm")).toBeVisible();
  });

  it("shows the recipient card with contact avatar when contacts are enabled", () => {
    const onSelect = jest.fn();
    render(
      <AddressMatchedSectionContainer
        result={{
          ...searchResult,
          status: "ens_resolved",
          resolvedAddress: address,
          ensName: "vitalik.eth",
          matchedContact: {
            contactId: "contact-remi",
            contactName: "Remi",
            addressId: "address-remi-ethereum",
            addressLabel: "Ethereum Network",
            address,
          },
        }}
        isContactsFeatureEnabled
        onSelect={onSelect}
      />,
    );

    expect(screen.getByTestId("send-recipient-card")).toBeVisible();
    expect(screen.getByTestId("send-recipient-card-avatar")).toHaveTextContent("Remi");

    fireEvent.press(screen.getByTestId("send-recipient-card-send"));
    expect(onSelect).toHaveBeenCalledWith(address, "vitalik.eth");
  });

  it("keeps add contact enabled as a no-op on the recipient card", () => {
    render(
      <AddressMatchedSectionContainer
        result={{
          ...searchResult,
          status: "valid",
          resolvedAddress: address,
        }}
        isContactsFeatureEnabled
      />,
    );

    expect(screen.getByTestId("send-recipient-card-add-contact")).toBeEnabled();
    expect(screen.getByTestId("send-recipient-card-send")).toBeEnabled();
  });
});
