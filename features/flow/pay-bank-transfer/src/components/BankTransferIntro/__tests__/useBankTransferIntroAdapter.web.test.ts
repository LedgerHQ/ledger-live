import { act, renderHook } from "@testing-library/react";
import { useBankTransferIntroAdapter } from "../useBankTransferIntroAdapter";
import { I18nWrapper } from "./i18nWrapper";

describe("useBankTransferIntroAdapter", () => {
  it("starts closed and toggles isOpen via open and onClosePress", () => {
    const { result } = renderHook(
      () => useBankTransferIntroAdapter({ onBankTransfer: jest.fn() }),
      {
        wrapper: I18nWrapper,
      },
    );

    expect(result.current.isOpen).toBe(false);
    expect(result.current.bankTransferIntro.isOpen).toBe(false);

    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);

    act(() => result.current.onClosePress());
    expect(result.current.isOpen).toBe(false);
  });

  it("passes onBankTransfer and onTrackEvent through into bankTransferIntro", () => {
    const onBankTransfer = jest.fn();
    const onTrackEvent = jest.fn();

    const { result } = renderHook(
      () =>
        useBankTransferIntroAdapter({
          heroImage: 7,
          bottomInset: 34,
          onBankTransfer,
          onTrackEvent,
        }),
      { wrapper: I18nWrapper },
    );

    const { bankTransferIntro } = result.current;
    expect(bankTransferIntro.heroImage).toBe(7);
    expect(bankTransferIntro.bottomInset).toBe(34);
    expect(bankTransferIntro.onBankTransfer).toBe(onBankTransfer);
    expect(bankTransferIntro.onTrackEvent).toBe(onTrackEvent);
  });

  it("emits onBankTransfer and closes on create account", () => {
    const onBankTransfer = jest.fn();
    const { result } = renderHook(() => useBankTransferIntroAdapter({ onBankTransfer }), {
      wrapper: I18nWrapper,
    });

    act(() => result.current.open());
    act(() => result.current.onCreateAccountPress());

    expect(onBankTransfer).toHaveBeenCalledWith("createAccount");
    expect(result.current.isOpen).toBe(false);
  });
});
