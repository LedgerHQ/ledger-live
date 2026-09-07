import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { BankTransferIntro } from "../BankTransferIntro";
import type { BankTransferIntroProps } from "../../../types";

const LABELS: BankTransferIntroProps["labels"] = {
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  continueLabel: "Continue",
  rows: [{ icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." }],
};

function renderIntro(overrides: Partial<BankTransferIntroProps> = {}) {
  const props: BankTransferIntroProps = {
    isOpen: true,
    labels: LABELS,
    onBankTransfer: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  return { props, ...render(<BankTransferIntro {...props} />) };
}

describe("BankTransferIntro (Native)", () => {
  afterEach(() => {
    cleanup();
  });

  it("tracks the page when opened", () => {
    const { props } = renderIntro();

    expect(props.onTrackEvent).toHaveBeenCalledWith("Page cash to stable", { flow: "C2S" });
  });

  it("tracks continue, hands off and closes", async () => {
    const user = userEvent.setup();
    const { props } = renderIntro();

    await user.press(screen.getByTestId("pay-bank-transfer-intro-continue"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "continue",
      flow: "C2S",
      page: "cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledTimes(1);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
