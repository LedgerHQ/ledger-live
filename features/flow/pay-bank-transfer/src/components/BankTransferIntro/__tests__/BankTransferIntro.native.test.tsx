import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import { BankTransferIntro } from "../BankTransferIntro";
import type { BankTransferIntroProps } from "../../../types";
import { I18nWrapper } from "./i18nWrapper";

jest.mock("@shared/ui-queued-bottom-sheet", () => ({
  QueuedBottomSheet: ({ children }: { children: React.ReactNode }) => children,
}));

function renderIntro(overrides: Partial<BankTransferIntroProps> = {}) {
  const props: BankTransferIntroProps = {
    isOpen: true,
    onBankTransfer: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  return {
    props,
    ...render(
      <I18nWrapper>
        <BankTransferIntro {...props} />
      </I18nWrapper>,
    ),
  };
}

describe("BankTransferIntro (Native)", () => {
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

    await user.press(screen.getByTestId("pay-bank-transfer-intro-create-account"));

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

    await user.press(screen.getByTestId("pay-bank-transfer-intro-log-in"));

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "log in to noah",
      flow: "C2S",
      page: "cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("logIn");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
