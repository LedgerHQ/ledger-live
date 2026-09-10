import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nTestProvider } from "@shared/i18n/testing";
import { BankTransferIntro } from "../BankTransferIntro";
import { useBankTransferIntroAdapter } from "../useBankTransferIntroAdapter";
import type { BankTransferIntroProps } from "../../../types";
import { I18nWrapper } from "./i18nWrapper";

function OpenIntro({
  onTrackEvent = jest.fn(),
}: {
  onTrackEvent?: BankTransferIntroProps["onTrackEvent"];
}) {
  const { open, bankTransferIntro } = useBankTransferIntroAdapter({
    onBankTransfer: jest.fn(),
    onTrackEvent,
  });
  React.useEffect(() => {
    open();
  }, [open]);
  return <BankTransferIntro {...bankTransferIntro} />;
}

function renderIntro(ui: React.ReactElement) {
  return render(<I18nWrapper>{ui}</I18nWrapper>);
}

describe("BankTransferIntro (Web)", () => {
  afterEach(() => {
    cleanup();
  });

  it("should render the intro copy", () => {
    const onTrackEvent = jest.fn();
    renderIntro(<OpenIntro onTrackEvent={onTrackEvent} />);

    expect(screen.getByRole("heading", { name: "Send cash, receive stablecoin" })).toBeVisible();
    expect(
      screen.getByText("Transfer cash and receive stablecoins straight to your Ledger Wallet™."),
    ).toBeVisible();
    expect(screen.getByText("Get salary, payments, deposits via SEPA or ACH.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Create an account" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Log in to Noah" })).toBeVisible();
    expect(screen.getByText("Provided by Noah")).toBeVisible();
    expect(onTrackEvent).toHaveBeenCalledWith("Page cash to stable", { flow: "C2S" });
  });

  it("should close after create account and track that CTA", async () => {
    const user = userEvent.setup();
    const onTrackEvent = jest.fn();
    renderIntro(<OpenIntro onTrackEvent={onTrackEvent} />);

    await user.click(screen.getByRole("button", { name: "Create an account" }));

    expect(
      screen.queryByRole("heading", { name: "Send cash, receive stablecoin" }),
    ).not.toBeInTheDocument();
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "create an account",
      flow: "C2S",
      page: "cash to stable",
    });
  });

  it("should close after log in and track that CTA", async () => {
    const user = userEvent.setup();
    const onTrackEvent = jest.fn();
    renderIntro(<OpenIntro onTrackEvent={onTrackEvent} />);

    await user.click(screen.getByRole("button", { name: "Log in to Noah" }));

    expect(
      screen.queryByRole("heading", { name: "Send cash, receive stablecoin" }),
    ).not.toBeInTheDocument();
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "log in to noah",
      flow: "C2S",
      page: "cash to stable",
    });
  });

  it("should close after header close and track close", async () => {
    const user = userEvent.setup();
    const onTrackEvent = jest.fn();
    renderIntro(<OpenIntro onTrackEvent={onTrackEvent} />);

    await user.click(screen.getByRole("button", { name: "Close" }));

    expect(
      screen.queryByRole("heading", { name: "Send cash, receive stablecoin" }),
    ).not.toBeInTheDocument();
    expect(onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "close",
      flow: "C2S",
      page: "cash to stable",
    });
  });

  it("should render nothing when closed", () => {
    renderIntro(
      <BankTransferIntro isOpen={false} onBankTransfer={jest.fn()} onClose={jest.fn()} />,
    );

    expect(
      screen.queryByRole("heading", { name: "Send cash, receive stablecoin" }),
    ).not.toBeInTheDocument();
  });

  it("resolves its copy from the mounted i18n provider, not from props", () => {
    render(
      <I18nTestProvider
        resources={{ en: { translation: { payTab: { bankTransferIntro: { title: "Envoyer" } } } } }}
      >
        <OpenIntro />
      </I18nTestProvider>,
    );

    expect(screen.getByRole("heading", { name: "Envoyer" })).toBeVisible();
  });
});
