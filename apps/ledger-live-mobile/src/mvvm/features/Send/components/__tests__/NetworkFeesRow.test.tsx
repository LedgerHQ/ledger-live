import React from "react";
import { render, screen } from "@testing-library/react-native";
import { NetworkFeesRow } from "../NetworkFeesRow";
import type { NetworkFeesViewModel } from "../../types";

const dismiss = jest.fn();

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 0, top: 0, left: 0, right: 0 }),
}));
jest.mock("LLM/components/InfoState", () => {
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
  return {
    Text: ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>,
    Button: ({ children }: { children: React.ReactNode }) => <RN.Text>{children}</RN.Text>,
    BottomSheet: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetView: ({ children }: { children: React.ReactNode }) => <RN.View>{children}</RN.View>,
    BottomSheetHeader: ({ title }: { title: React.ReactNode }) => <RN.Text>{title}</RN.Text>,
    Divider: () => null,
    useBottomSheetRef: () => ({ current: { present: jest.fn(), dismiss } }),
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
jest.mock("~/analytics", () => ({
  useAnalytics: () => ({ track: jest.fn() }),
}));
jest.mock("@ledgerhq/ledger-wallet-framework/tracking/send", () => ({
  getSendFlowTrackingProperties: () => ({}),
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
