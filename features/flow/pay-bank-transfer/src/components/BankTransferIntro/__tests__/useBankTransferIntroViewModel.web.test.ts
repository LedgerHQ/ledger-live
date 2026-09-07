import { renderHook } from "@testing-library/react";
import { useBankTransferIntroViewModel } from "../useBankTransferIntroViewModel";
import type { BankTransferIntroProps } from "../../../types";

const LABELS: BankTransferIntroProps["labels"] = {
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  continueLabel: "Continue",
  rows: [
    { icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." },
    { icon: "Globe", title: "Receive stablecoins", description: "Get USDC or USDT." },
    { icon: "CreditCard", title: "Spend with your card", description: "Use stablecoins anywhere." },
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
    expect(result.current.continueLabel).toBe(LABELS.continueLabel);
    expect(result.current.rows).toEqual(LABELS.rows);
  });

  it("tracks the cash-to-stable page when shown", () => {
    const { props, result } = setup();

    result.current.onShown();

    expect(props.onTrackEvent).toHaveBeenCalledWith("Page cash to stable", { flow: "C2S" });
  });

  it("tracks continue, emits onBankTransfer, then closes", () => {
    const { props, result } = setup();

    result.current.onContinuePress();

    expect(props.onTrackEvent).toHaveBeenCalledWith("button_clicked", {
      button: "continue",
      flow: "C2S",
      page: "cash to stable",
    });
    expect(props.onBankTransfer).toHaveBeenCalledTimes(1);
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

  it("does not throw when no tracker is provided", () => {
    const { props, result } = setup({ onTrackEvent: undefined });

    expect(() => result.current.onShown()).not.toThrow();
    expect(() => result.current.onContinuePress()).not.toThrow();
    expect(props.onBankTransfer).toHaveBeenCalledTimes(1);
  });
});
