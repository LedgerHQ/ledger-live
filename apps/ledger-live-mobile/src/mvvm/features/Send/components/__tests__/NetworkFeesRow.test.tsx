import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { NetworkFeesRow } from "../NetworkFeesRow";
import type { NetworkFeesViewModel, SponsoredFeeEntryViewModel } from "../../types";

const dismiss = jest.fn();
const mockPresent = jest.fn();
const mockOnConfirm = jest.fn();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));
jest.mock("@shared/ui-info-state", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    InfoState: ({
      title,
      description,
    }: {
      title?: React.ReactNode;
      description?: React.ReactNode;
    }) => (
      <RN.View>
        {title ? <RN.Text>{title}</RN.Text> : null}
        {description ? <RN.Text>{description}</RN.Text> : null}
      </RN.View>
    ),
  };
});
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  const Passthrough = ({ children }: { children?: React.ReactNode }) => (
    <RN.View>{children}</RN.View>
  );
  return {
    Box: Passthrough,
    Card: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <RN.View testID={testID}>{children}</RN.View>
    ),
    CardHeader: Passthrough,
    CardLeading: Passthrough,
    CardTrailing: Passthrough,
    CardContent: Passthrough,
    CardContentRow: Passthrough,
    CardContentTitle: ({ children }: { children: React.ReactNode }) => (
      <RN.Text>{children}</RN.Text>
    ),
    CardContentDescription: ({ children }: { children: React.ReactNode }) => (
      <RN.Text>{children}</RN.Text>
    ),
    CardFooter: Passthrough,
    Link: ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>,
    Text: ({ children, testID }: { children: React.ReactNode; testID?: string }) => (
      <RN.Text testID={testID}>{children}</RN.Text>
    ),
    Tag: ({ label, testID }: { label: string; testID?: string }) => (
      <RN.Text testID={testID}>{label}</RN.Text>
    ),
    Button: ({
      children,
      onPress,
      testID,
    }: {
      children: React.ReactNode;
      onPress?: () => void;
      testID?: string;
    }) => (
      <RN.Pressable onPress={onPress} testID={testID}>
        <RN.Text>{children}</RN.Text>
      </RN.Pressable>
    ),
    BottomSheet: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: ({ title }: { title: React.ReactNode }) => <RN.Text>{title}</RN.Text>,
    Divider: () => null,
    useBottomSheetRef: () => ({ current: { present: mockPresent, dismiss } }),
  };
});
jest.mock("@ledgerhq/lumen-ui-rnative/symbols", () => ({
  Information: () => null,
  ChevronDown: () => null,
  Check: () => null,
}));
jest.mock("@ledgerhq/lumen-ui-rnative/styles", () => ({
  useStyleSheet: (createStyles: (theme: { spacings: Record<string, number> }) => unknown) =>
    createStyles({
      spacings: { s4: 4, s8: 8, s10: 10, s12: 12, s16: 16, s24: 24 },
    }),
}));
jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({
    t: (key: string, vals?: Record<string, string | number>) =>
      vals ? `${key} ${JSON.stringify(vals)}` : key,
  }),
}));
jest.mock("../../context/SendFlowContext", () => ({
  useSendFlowData: () => ({
    state: { account: { account: null, parentAccount: null } },
  }),
}));
jest.mock("../../utils/tracking", () => ({
  getSendFlowTrackingProperties: () => ({}),
}));
jest.mock("../FeePaymentSheet/useFeePaymentSheetViewModel", () => ({
  useFeePaymentSheetViewModel: () => ({
    title: "Select fee payment",
    disclaimer: "Disclaimer",
    learnMoreLabel: "Learn more",
    onLearnMore: jest.fn(),
    options: [
      {
        id: "tronify",
        label: "Pay with Provider",
        paidInLabel: "Paid in USDT",
        fee: null,
        selected: true,
        disabled: false,
        note: null,
      },
    ],
    confirmLabel: "Confirm",
    confirmDisabled: false,
    onSelect: jest.fn(),
    onConfirm: mockOnConfirm,
    onClose: jest.fn(),
  }),
}));

const baseViewModel: NetworkFeesViewModel = {
  label: "Network fees",
  value: "0 TRX",
  secondaryValue: null,
  strategyLabel: "",
  selectedFeeStrategy: null,
  displayOptions: [],
  canOpenSelector: false,
  networkFeesInfo: null,
};

const editableViewModel: NetworkFeesViewModel = {
  ...baseViewModel,
  canOpenSelector: true,
  displayOptions: [
    {
      id: "medium",
      kind: "preset",
      label: "Medium option",
      sublabel: null,
      selected: true,
      onSelect: jest.fn(),
    },
  ],
};

describe("NetworkFeesRow fee value", () => {
  beforeEach(() => jest.clearAllMocks());

  it("shows the value followed by the strategy label when the fee is editable", () => {
    render(
      <NetworkFeesRow
        viewModel={{
          ...editableViewModel,
          value: "$0.12",
          strategyLabel: "Medium",
        }}
      />,
    );
    expect(screen.getByText("$0.12")).toBeOnTheScreen();
    expect(screen.getByText("Medium")).toBeOnTheScreen();
  });

  it("shows both values and no strategy label when the fee is read-only", () => {
    render(
      <NetworkFeesRow
        viewModel={{
          ...baseViewModel,
          value: "$0.10",
          secondaryValue: "0.00056 SOL",
          strategyLabel: "Medium",
        }}
      />,
    );
    expect(screen.getByText("$0.10")).toBeOnTheScreen();
    expect(screen.getByText("0.00056 SOL")).toBeOnTheScreen();
    expect(screen.queryByText("Medium")).toBeNull();
  });
});

describe("NetworkFeesRow info drawer", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders the generic static copy when no currency-specific info is present", () => {
    render(<NetworkFeesRow viewModel={baseViewModel} />);
    expect(screen.getByText("send.newSendFlow.feesPaid")).toBeOnTheScreen();
  });

  it("renders the TRON sufficient title and body when the breakdown covers the fee", () => {
    render(
      <NetworkFeesRow
        viewModel={{
          ...baseViewModel,
          networkFeesInfo: {
            translationKey: "tronFees.sufficient",
            values: { energy: "65000", bandwidth: "1500" },
          },
        }}
      />,
    );
    expect(screen.getByText("send.newSendFlow.tronFees.sufficient.title")).toBeOnTheScreen();
    expect(
      screen.getByText(/send\.newSendFlow\.tronFees\.sufficient\.description.*65000.*1500/),
    ).toBeOnTheScreen();
  });

  it("renders the TRON insufficient breakdown title and burn-TRX body", () => {
    render(
      <NetworkFeesRow
        viewModel={{
          ...baseViewModel,
          networkFeesInfo: {
            translationKey: "tronFees.insufficient",
            values: { energy: "0", bandwidth: "1500" },
          },
        }}
      />,
    );
    expect(screen.getByText("send.newSendFlow.tronFees.insufficient.title")).toBeOnTheScreen();
    expect(
      screen.getByText(/send\.newSendFlow\.tronFees\.insufficient\.description/),
    ).toBeOnTheScreen();
  });
});

describe("NetworkFeesRow sponsored fee entry", () => {
  const sponsoredEntry: SponsoredFeeEntryViewModel = {
    label: "Saved with Provider",
    selected: true,
    fee: { value: "€2.80", secondaryValue: "3.2 USDT", originalValue: "€3.60" },
    infoDescription: "With Provider, a third-party energy provider, fees are paid in USDT.",
    error: null,
  };

  beforeEach(() => jest.clearAllMocks());

  it("shows the sponsored fee over the struck standard price, with the saved badge", () => {
    render(<NetworkFeesRow viewModel={editableViewModel} sponsored={sponsoredEntry} />);

    expect(screen.getByTestId("send-sponsored-fee-saved-badge")).toHaveTextContent(
      "Saved with Provider",
    );
    expect(screen.getByTestId("send-sponsored-fee-original-value")).toHaveTextContent("€3.60");
    expect(screen.getByTestId("send-sponsored-fee-value")).toHaveTextContent("€2.80");
    expect(screen.getByText("3.2 USDT")).toBeOnTheScreen();
  });

  it("nudges toward the sponsored fee while the standard fee is picked", () => {
    render(
      <NetworkFeesRow
        viewModel={{ ...editableViewModel, value: "$4.12" }}
        sponsored={{
          ...sponsoredEntry,
          label: "You could save $0.90 with Provider",
          selected: false,
          fee: null,
          infoDescription: null,
        }}
      />,
    );

    expect(screen.getByTestId("send-sponsored-fee-nudge")).toHaveTextContent(
      "You could save $0.90 with Provider",
    );
    expect(screen.getByText("$4.12")).toBeOnTheScreen();
    expect(screen.queryByTestId("send-sponsored-fee-original-value")).toBeNull();
    expect(screen.getByText("send.newSendFlow.feesPaid")).toBeOnTheScreen();
  });

  it("opens the fee payment sheet instead of the strategy selector", () => {
    render(
      <NetworkFeesRow
        viewModel={{ ...editableViewModel, strategyLabel: "Medium" }}
        sponsored={sponsoredEntry}
      />,
    );

    fireEvent.press(screen.getByTestId("send-fee-payment-entry"));

    expect(mockPresent).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Medium")).toBeNull();
  });

  it("renders the fee payment options in the sheet", () => {
    render(<NetworkFeesRow viewModel={editableViewModel} sponsored={sponsoredEntry} />);

    expect(screen.getByTestId("send-fee-payment-option-tronify")).toHaveTextContent(
      /Pay with Provider.*Paid in USDT/,
    );
    fireEvent.press(screen.getByTestId("send-fee-payment-confirm"));

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("explains the sponsored fee in the info drawer, and says why it can't be paid", () => {
    render(
      <NetworkFeesRow
        viewModel={editableViewModel}
        sponsored={{ ...sponsoredEntry, error: "Not enough USDT" }}
      />,
    );

    expect(
      screen.getByText("With Provider, a third-party energy provider, fees are paid in USDT."),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("send-sponsored-fee-error")).toHaveTextContent("Not enough USDT");
  });

  it("renders no fee payment entry or sheet without a sponsored option", () => {
    render(<NetworkFeesRow viewModel={editableViewModel} sponsored={null} />);

    expect(screen.queryByTestId("send-fee-payment-entry")).toBeNull();
    expect(screen.queryByTestId("send-fee-payment-options")).toBeNull();
  });
});
