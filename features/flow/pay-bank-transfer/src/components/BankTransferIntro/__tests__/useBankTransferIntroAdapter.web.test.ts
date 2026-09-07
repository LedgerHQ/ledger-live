import { act, renderHook } from "@testing-library/react";
import type { BankTransferIntroLabels } from "../../../types";
import { useBankTransferIntroAdapter } from "../useBankTransferIntroAdapter";

const labels: BankTransferIntroLabels = {
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  continueLabel: "Continue",
  rows: [{ icon: "Bank", title: "Bank transfer", description: "Send USD or EUR." }],
};

describe("useBankTransferIntroAdapter", () => {
  it("starts closed and toggles isOpen via open and onClosePress", () => {
    const { result } = renderHook(() =>
      useBankTransferIntroAdapter({ labels, onBankTransfer: jest.fn() }),
    );

    expect(result.current.isOpen).toBe(false);
    expect(result.current.bankTransferIntro.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.onClosePress());
    expect(result.current.isOpen).toBe(false);
  });

  it("passes labels, onBankTransfer and onTrackEvent through into bankTransferIntro", () => {
    const onBankTransfer = jest.fn();
    const onTrackEvent = jest.fn();

    const { result } = renderHook(() =>
      useBankTransferIntroAdapter({ labels, onBankTransfer, onTrackEvent }),
    );

    const { bankTransferIntro } = result.current;
    expect(bankTransferIntro.labels).toBe(labels);
    expect(bankTransferIntro.onBankTransfer).toBe(onBankTransfer);
    expect(bankTransferIntro.onTrackEvent).toBe(onTrackEvent);
  });

  it("emits onBankTransfer and closes on continue", () => {
    const onBankTransfer = jest.fn();
    const { result } = renderHook(() => useBankTransferIntroAdapter({ labels, onBankTransfer }));

    act(() => result.current.open());
    act(() => result.current.onContinuePress());

    expect(onBankTransfer).toHaveBeenCalledTimes(1);
    expect(result.current.isOpen).toBe(false);
  });
});
