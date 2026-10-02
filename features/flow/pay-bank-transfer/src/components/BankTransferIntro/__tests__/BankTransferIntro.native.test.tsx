import React from "react";
import { cleanup, render, screen, userEvent } from "@testing-library/react-native";
import {
  trackButtonClicked,
  trackedPages,
} from "@features/platform-pay-analytics/testing/module-mock";
import { BankTransferIntro } from "../BankTransferIntro";
import type { BankTransferIntroProps } from "../../../types";
import { I18nWrapper } from "./i18nWrapper";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

function renderIntro(overrides: Partial<BankTransferIntroProps> = {}) {
  const props: BankTransferIntroProps = {
    isOpen: true,
    onBankTransfer: jest.fn(),
    onClose: jest.fn(),
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
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("tracks the page when opened", () => {
    renderIntro();

    expect(trackedPages()).toContainEqual({
      page: "Feature Intro",
      name: "Cash to stable",
      flow: "Cash to stable",
    });
  });

  it("tracks create account, hands off and closes", async () => {
    const user = userEvent.setup();
    const { props } = renderIntro();

    await user.press(screen.getByTestId("pay-bank-transfer-intro-create-account"));

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "create an account",
      flow: "Cash to stable",
      page: "Feature Intro Cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("createAccount");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("tracks log in, hands off and closes", async () => {
    const user = userEvent.setup();
    const { props } = renderIntro();

    await user.press(screen.getByTestId("pay-bank-transfer-intro-log-in"));

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "log in to noah",
      flow: "Cash to stable",
      page: "Feature Intro Cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("logIn");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
