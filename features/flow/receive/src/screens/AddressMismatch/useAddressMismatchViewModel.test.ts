import { act, renderHook } from "@testing-library/react";
import { track } from "@shared/analytics";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useAddressMismatchViewModel } from "./useAddressMismatchViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

function renderViewModel() {
  const onContactSupport = jest.fn();
  const onClose = jest.fn();
  const { result } = renderHook(() => useAddressMismatchViewModel({ onContactSupport, onClose }), {
    wrapper: I18nTestProvider,
  });
  return { onContactSupport, onClose, result };
}

describe("useAddressMismatchViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve the copy from the receiveAddress keys", () => {
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      title: "receiveAddress.addressMismatch.title",
      description: "receiveAddress.addressMismatch.description",
      contactSupportLabel: "receiveAddress.addressMismatch.contactSupportCta",
      closeLabel: "receiveAddress.addressMismatch.closeCta",
    });
  });

  it("should track Contact Ledger Support before opening support, without closing", () => {
    const { onContactSupport, onClose, result } = renderViewModel();

    act(() => result.current.onContactSupport());

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Contact Ledger Support",
      page: "Receive Address Verification",
      flow: "receive",
    });
    expect(onContactSupport).toHaveBeenCalledTimes(1);
    expect(mockTrack.mock.invocationCallOrder[0]).toBeLessThan(
      onContactSupport.mock.invocationCallOrder[0],
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it("should track Close before closing", () => {
    const { onClose, result } = renderViewModel();

    act(() => result.current.onClose());

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Close",
      page: "Receive Address Verification",
      flow: "receive",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(mockTrack.mock.invocationCallOrder[0]).toBeLessThan(onClose.mock.invocationCallOrder[0]);
  });
});
