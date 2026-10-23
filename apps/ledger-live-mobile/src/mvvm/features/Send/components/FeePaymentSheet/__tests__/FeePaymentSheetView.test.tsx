import React from "react";
import { fireEvent, render, screen } from "@tests/test-renderer";
import { FeePaymentSheetView } from "../FeePaymentSheetView";
import type { FeePaymentSheetViewModel } from "../types";

// The header reads its BottomSheet's context; the sheet itself is NetworkFeesRow's.
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const RN = jest.requireActual<typeof import("react-native")>("react-native");
  return {
    ...jest.requireActual("@ledgerhq/lumen-ui-rnative"),
    BottomSheetHeader: ({ title }: { title: string }) => <RN.Text>{title}</RN.Text>,
  };
});

const onSelect = jest.fn();
const onConfirm = jest.fn();
const onLearnMore = jest.fn();

const viewModel: Omit<FeePaymentSheetViewModel, "onClose"> = {
  title: "Select fee payment",
  disclaimer: "With Provider, a third-party energy provider, fees are paid in USDT.",
  learnMoreLabel: "Learn more",
  onLearnMore,
  options: [
    {
      id: "sponsored",
      label: "Pay with Provider",
      paidInLabel: "Paid in USDT",
      fee: { value: "$3.22", secondaryValue: "3.22324 USDT", originalValue: "$4.12" },
      selected: false,
      disabled: false,
      note: null,
    },
    {
      id: "standard",
      label: "Regular transfer",
      paidInLabel: "Paid in TRX",
      fee: { value: "$4.12", secondaryValue: "2.32923 TRX", originalValue: null },
      selected: true,
      disabled: false,
      note: null,
    },
  ],
  confirmLabel: "Confirm",
  confirmDisabled: false,
  onSelect,
  onConfirm,
};

describe("FeePaymentSheetView", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists each option with what it is paid in and its own fee", () => {
    render(<FeePaymentSheetView {...viewModel} />);

    expect(screen.getByText("Select fee payment")).toBeOnTheScreen();
    expect(screen.getByTestId("send-fee-payment-option-sponsored")).toHaveTextContent(
      /Pay with Provider.*Paid in USDT.*\$4\.12.*\$3\.22.*3\.22324 USDT/,
    );
    expect(screen.getByTestId("send-fee-payment-option-standard")).toHaveTextContent(
      /Regular transfer.*Paid in TRX.*\$4\.12.*2\.32923 TRX/,
    );
    expect(screen.getByTestId("send-fee-payment-option-sponsored-original-fee")).toHaveTextContent(
      "$4.12",
    );
    expect(screen.queryByTestId("send-fee-payment-option-standard-original-fee")).toBeNull();
  });

  it("marks the picked option selected", () => {
    render(<FeePaymentSheetView {...viewModel} />);

    expect(screen.getByTestId("send-fee-payment-option-standard")).toBeSelected();
    expect(screen.getByTestId("send-fee-payment-option-sponsored")).not.toBeSelected();
  });

  it("hands a pressed option to the view model", () => {
    render(<FeePaymentSheetView {...viewModel} />);

    fireEvent.press(screen.getByTestId("send-fee-payment-option-sponsored"));

    expect(onSelect).toHaveBeenCalledWith("sponsored");
  });

  it("confirms the pick from Confirm", () => {
    render(<FeePaymentSheetView {...viewModel} />);

    fireEvent.press(screen.getByTestId("send-fee-payment-confirm"));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("opens the article from Learn more", () => {
    render(<FeePaymentSheetView {...viewModel} />);

    fireEvent.press(screen.getByTestId("send-fee-payment-learn-more"));

    expect(onLearnMore).toHaveBeenCalledTimes(1);
  });

  it("ends the disclaimer with Learn more", () => {
    render(<FeePaymentSheetView {...viewModel} />);

    expect(screen.getByTestId("send-fee-payment-disclaimer")).toHaveTextContent(
      "With Provider, a third-party energy provider, fees are paid in USDT. Learn more",
    );
  });

  it("disables an option that can't be paid, says why, and blocks Confirm", () => {
    const [sponsored, standard] = viewModel.options;
    render(
      <FeePaymentSheetView
        {...viewModel}
        options={[{ ...sponsored, disabled: true, note: "Not enough USDT" }, standard]}
        confirmDisabled
      />,
    );

    expect(screen.getByTestId("send-fee-payment-option-sponsored")).toBeDisabled();
    expect(screen.getByTestId("send-fee-payment-option-sponsored-note")).toHaveTextContent(
      "Not enough USDT",
    );
    expect(screen.getByTestId("send-fee-payment-confirm")).toBeDisabled();
  });

  it("shows no fee on an option before a quote", () => {
    const [sponsored, standard] = viewModel.options;
    render(
      <FeePaymentSheetView
        {...viewModel}
        options={[
          { ...sponsored, fee: null },
          { ...standard, fee: null },
        ]}
      />,
    );

    expect(screen.queryByTestId("send-fee-payment-option-sponsored-fee")).toBeNull();
    expect(screen.queryByTestId("send-fee-payment-option-standard-fee")).toBeNull();
  });
});
