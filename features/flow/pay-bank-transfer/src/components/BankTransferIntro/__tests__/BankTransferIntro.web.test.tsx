import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BankTransferIntro } from "../BankTransferIntro";
import type { BankTransferIntroProps } from "../../../types";

const LABELS: BankTransferIntroProps["labels"] = {
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  createAccountLabel: "Create an account",
  logInLabel: "Log in",
  providedBy: "Provided by Noah",
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

describe("BankTransferIntro (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("tracks the page when opened", () => {
    const { props } = renderIntro();

    expect(props.onTrackEvent).toHaveBeenCalledWith("Page cash to stable", { flow: "C2S" });
  });

  it("tracks create account, hands off and closes", async () => {
    const user = userEvent.setup();
    const { props } = renderIntro();

    await user.click(screen.getByTestId("pay-bank-transfer-intro-create-account"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "create an account",
      flow: "C2S",
      page: "cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("createAccount");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("tracks log in, hands off and closes", async () => {
    const user = userEvent.setup();
    const { props } = renderIntro();

    await user.click(screen.getByTestId("pay-bank-transfer-intro-log-in"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "log in to noah",
      flow: "C2S",
      page: "cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("logIn");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when closed", () => {
    renderIntro({ isOpen: false });

    expect(screen.queryByTestId("pay-bank-transfer-intro-content")).toBeNull();
  });
});
