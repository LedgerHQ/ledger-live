import { CONTACTS_TRACK_EVENTS } from "@features/flow-contacts";
import { act, renderHook } from "tests/testSetup";
import { useAddContactDialogAdapter } from "./useAddContactDialogAdapter";

const mockTrackEvent = jest.fn();

jest.mock("../../analytics", () => ({
  useContactsAnalytics: () => ({
    trackEvent: mockTrackEvent,
    trackPage: jest.fn(),
  }),
}));

describe("useAddContactDialogAdapter", () => {
  beforeEach(() => {
    mockTrackEvent.mockClear();
  });

  it("should not track error_displayed when a valid contact is saved", async () => {
    const { result } = renderHook(() => useAddContactDialogAdapter(jest.fn()));

    act(() => {
      result.current.onOpen();
    });
    act(() => {
      result.current.onDraftNameChange("Ada");
    });

    await act(async () => {
      await result.current.onConfirm();
    });

    expect(mockTrackEvent).not.toHaveBeenCalledWith(
      CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED,
      expect.anything(),
    );
  });

  it("should track error_displayed when an invalid contact name is shown", () => {
    const { result } = renderHook(() => useAddContactDialogAdapter(jest.fn()));

    act(() => {
      result.current.onOpen();
    });
    act(() => {
      result.current.onDraftNameChange("Ada1");
    });

    expect(mockTrackEvent).toHaveBeenCalledWith(
      CONTACTS_TRACK_EVENTS.ERROR_DISPLAYED,
      expect.objectContaining({
        errorType: "invalid name",
      }),
    );
  });
});
