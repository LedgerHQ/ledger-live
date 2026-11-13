import { act, renderHook } from "@testing-library/react";
import { track } from "@shared/analytics";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useAddressDisplayedViewModel } from "./useAddressDisplayedViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

function renderViewModel() {
  const onGotIt = jest.fn();
  const { result } = renderHook(() => useAddressDisplayedViewModel({ onGotIt }), {
    wrapper: I18nTestProvider,
  });
  return { onGotIt, result };
}

describe("useAddressDisplayedViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve the copy from the receiveAddress keys", () => {
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      title: "receiveAddress.addressDisplayed.title",
      description: "receiveAddress.addressDisplayed.description",
      gotItLabel: "receiveAddress.addressDisplayed.gotItCta",
    });
  });

  it("should track the Got it click before acknowledging", () => {
    const { onGotIt, result } = renderViewModel();

    act(() => result.current.onGotIt());

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Got it",
      page: "Receive Address Verification",
      flow: "receive",
    });
    expect(onGotIt).toHaveBeenCalledTimes(1);
    expect(mockTrack.mock.invocationCallOrder[0]).toBeLessThan(onGotIt.mock.invocationCallOrder[0]);
  });
});
