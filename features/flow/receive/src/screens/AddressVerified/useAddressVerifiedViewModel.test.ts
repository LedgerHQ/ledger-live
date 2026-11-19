import { act, renderHook } from "@testing-library/react";
import { track } from "@shared/analytics";
import { I18nTestProvider } from "@shared/i18n/testing";
import { useAddressVerifiedViewModel } from "./useAddressVerifiedViewModel";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

const mockTrack = jest.mocked(track);

function renderViewModel() {
  const onDone = jest.fn();
  const { result } = renderHook(() => useAddressVerifiedViewModel({ onDone }), {
    wrapper: I18nTestProvider,
  });
  return { onDone, result };
}

describe("useAddressVerifiedViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should resolve the copy from the receiveAddress keys", () => {
    const { result } = renderViewModel();

    expect(result.current).toMatchObject({
      title: "receiveAddress.addressVerified.title",
      description: "receiveAddress.addressVerified.description",
      doneLabel: "receiveAddress.addressVerified.doneCta",
    });
  });

  it("should track the Done click before finishing", () => {
    const { onDone, result } = renderViewModel();

    act(() => result.current.onDone());

    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "Done",
      page: "Receive Address Verification",
      flow: "receive",
    });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(mockTrack.mock.invocationCallOrder[0]).toBeLessThan(onDone.mock.invocationCallOrder[0]);
  });
});
