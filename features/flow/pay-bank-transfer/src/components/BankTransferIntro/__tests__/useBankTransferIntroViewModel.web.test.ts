import { renderHook } from "@testing-library/react";
import { useBankTransferIntroViewModel } from "../useBankTransferIntroViewModel";
import type { BankTransferIntroProps } from "../../../types";

const LABELS: BankTransferIntroProps["labels"] = {
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  createAccountLabel: "Create an account",
  logInLabel: "Log in",
  providedBy: "Provided by Noah",
  rows: [
    { icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." },
    { icon: "Coins", title: "No hidden fees", description: "Direct from bank to blockchain." },
    { icon: "Chart5", title: "Put your money to work", description: "Swap or earn stablecoin." },
  ],
};

function setup(overrides: Partial<BankTransferIntroProps> = {}) {
  const props: BankTransferIntroProps = {
    isOpen: true,
    labels: LABELS,
    onBankTransfer: jest.fn(),
    onClose: jest.fn(),
    onTrackEvent: jest.fn(),
    ...overrides,
  };
  const { result } = renderHook(() => useBankTransferIntroViewModel(props));
  return { props, result };
}

describe("useBankTransferIntroViewModel", () => {
  it("exposes the injected labels", () => {
    const { result } = setup();

    expect(result.current.title).toBe(LABELS.title);
    expect(result.current.description).toBe(LABELS.description);
    expect(result.current.createAccountLabel).toBe(LABELS.createAccountLabel);
    expect(result.current.logInLabel).toBe(LABELS.logInLabel);
    expect(result.current.rows).toEqual(LABELS.rows);
  });

  it("tracks the cash-to-stable page when shown", () => {
    const { props, result } = setup();

    result.current.onShown();

    expect(props.onTrackEvent).toHaveBeenCalledWith("Page cash to stable", { flow: "C2S" });
  });

  it("tracks create account, emits onBankTransfer, then closes", () => {
    const { props, result } = setup();

    result.current.onCreateAccountPress();

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "create an account",
      flow: "C2S",
      page: "cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledWith("createAccount");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("tracks close and dismisses without handing off", () => {
    const { props, result } = setup();

    result.current.onClosePress();

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "close",
      flow: "C2S",
      page: "cash to stable",
    });
    expect(props.onBankTransfer).not.toHaveBeenCalled();
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("forwards the host-bundled hero image", () => {
    const heroImage = 42;
    const { result } = setup({ heroImage });

    expect(result.current.heroImage).toBe(heroImage);
  });

  it("does not throw when no tracker is provided", () => {
    const { props, result } = setup({ onTrackEvent: undefined });

    expect(() => result.current.onShown()).not.toThrow();
    expect(() => result.current.onCreateAccountPress()).not.toThrow();
    expect(props.onBankTransfer).toHaveBeenCalledTimes(1);
  });
});
