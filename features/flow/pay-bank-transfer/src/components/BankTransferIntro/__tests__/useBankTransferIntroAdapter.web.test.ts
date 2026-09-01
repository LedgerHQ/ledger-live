import { act, renderHook } from "@testing-library/react";
import type { BankTransferIntroLabels } from "../../../types";
import { useBankTransferIntroAdapter } from "../useBankTransferIntroAdapter";

const labels: BankTransferIntroLabels = {
  title: "Convert cash to stablecoins",
  description: "Transfer USD or EUR from your bank.",
  createAccountLabel: "Create an account",
  logInLabel: "Log in",
  providedBy: "Provided by Noah",
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
      useBankTransferIntroAdapter({
        labels,
        heroImage: 7,
        bottomInset: 34,
        onBankTransfer,
        onTrackEvent,
      }),
    );

    const { bankTransferIntro } = result.current;
    expect(bankTransferIntro.labels).toBe(labels);
    expect(bankTransferIntro.heroImage).toBe(7);
    expect(bankTransferIntro.bottomInset).toBe(34);
    expect(bankTransferIntro.onBankTransfer).toBe(onBankTransfer);
    expect(bankTransferIntro.onTrackEvent).toBe(onTrackEvent);
  });

  it("emits onBankTransfer and closes on create account", () => {
    const onBankTransfer = jest.fn();
    const { result } = renderHook(() => useBankTransferIntroAdapter({ labels, onBankTransfer }));

    act(() => result.current.open());
    act(() => result.current.onCreateAccountPress());

    expect(onBankTransfer).toHaveBeenCalledWith("createAccount");
    expect(result.current.isOpen).toBe(false);
  });
});
