import { renderHook } from "@testing-library/react";
import { useBankTransferIntroViewModel } from "../useBankTransferIntroViewModel";
import type { BankTransferIntroProps } from "../../../types";
import { I18nWrapper } from "./i18nWrapper";
import { trackButtonClicked } from "@features/platform-pay-analytics/testing/module-mock";

jest.mock("@features/platform-pay-analytics", () =>
  jest.requireActual("@features/platform-pay-analytics/testing/module-mock"),
);

function setup(overrides: Partial<BankTransferIntroProps> = {}) {
  const props: BankTransferIntroProps = {
    isOpen: true,
    onBankTransfer: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useBankTransferIntroViewModel(props), {
    wrapper: I18nWrapper,
  });
  return { props, result };
}

describe("useBankTransferIntroViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("resolves copy from the mounted i18n provider", () => {
    const { result } = setup();

    expect(result.current.title).toBe("Send cash, receive stablecoin");
    expect(result.current.description).toBe(
      "Transfer cash and receive stablecoins straight to your Ledger Wallet™.",
    );
    expect(result.current.createAccountLabel).toBe("Create an account");
    expect(result.current.logInLabel).toBe("Log in to Noah");
    expect(result.current.providedBy).toBe("Provided by Noah");
    expect(result.current.rows).toEqual([
      {
        icon: "Bank",
        title: "Receive transfers from any bank",
        description: "Get salary, payments, deposits via SEPA or ACH.",
      },
      {
        icon: "Coins",
        title: "No hidden fees",
        description: "Direct from bank to blockchain for 0.25% fees.",
      },
      {
        icon: "Chart5",
        title: "Put your money to work right away",
        description: "You can swap or earn with your stablecoin.",
      },
    ]);
  });

  it("tracks create account, emits onBankTransfer, then closes", () => {
    const { props, result } = setup();

    result.current.onCreateAccountPress();

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "create an account",
      flow: "Cash to stable",
      page: "Feature Intro Cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("createAccount");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("tracks log in, emits onBankTransfer, then closes", () => {
    const { props, result } = setup();

    result.current.onLogInPress();

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "log in to noah",
      flow: "Cash to stable",
      page: "Feature Intro Cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("logIn");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("tracks close and dismisses without handing off", () => {
    const { props, result } = setup();

    result.current.onClosePress();

    expect(trackButtonClicked).toHaveBeenCalledWith({
      button: "close",
      flow: "Cash to stable",
      page: "Feature Intro Cash to stable",
    });
    expect(props.onBankTransfer).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("forwards the host-bundled hero image", () => {
    const heroImage = 42;
    const { result } = setup({ heroImage });

    expect(result.current.heroImage).toBe(heroImage);
  });
});
