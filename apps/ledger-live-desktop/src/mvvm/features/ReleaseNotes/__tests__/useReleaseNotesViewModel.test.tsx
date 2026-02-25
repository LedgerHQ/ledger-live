import { renderHook, act } from "tests/testSetup";
import useReleaseNotesViewModel from "../hooks/useReleaseNotesViewModel";
import { openReleaseNotes } from "../releaseNotesDialog";
import { MOCK_RELEASE_NOTES } from "./helpers";

jest.mock("../../../../../release-notes.json", () => [
  { tag_name: "2.80.0", body: "## What's new\n\n- Feature A\n- Feature B" },
  { tag_name: "2.79.0", body: "## Bug fixes\n\n- Fix X\n- Fix Y" },
]);

describe("useReleaseNotesViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return isOpen as false initially", () => {
    const { result } = renderHook(() => useReleaseNotesViewModel());

    expect(result.current.isOpen).toBe(false);
  });

  it("should load release notes data", () => {
    const { result } = renderHook(() => useReleaseNotesViewModel());

    expect(result.current.notes).toHaveLength(MOCK_RELEASE_NOTES.length);
    expect(result.current.notes[0].tag_name).toBe("2.80.0");
    expect(result.current.notes[1].tag_name).toBe("2.79.0");
  });

  it("should close when onClose is called", () => {
    const { result, store } = renderHook(() => useReleaseNotesViewModel());

    act(() => {
      store.dispatch(openReleaseNotes());
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.onClose();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it("should track analytics when dialog opens", () => {
    const { track } = jest.requireMock("~/renderer/analytics/segment");
    const { store } = renderHook(() => useReleaseNotesViewModel());

    act(() => {
      store.dispatch(openReleaseNotes());
    });

    expect(track).toHaveBeenCalledWith("page_viewed", { page: "Release Notes Dialog" });
  });

  it("should not track analytics when dismissed via onClose", () => {
    const { track } = jest.requireMock("~/renderer/analytics/segment");
    const { result, store } = renderHook(() => useReleaseNotesViewModel());

    act(() => {
      store.dispatch(openReleaseNotes());
    });
    track.mockClear();

    act(() => {
      result.current.onClose();
    });

    expect(track).not.toHaveBeenCalled();
  });

  it("should track analytics when Got it button is clicked via onGotIt", () => {
    const { track } = jest.requireMock("~/renderer/analytics/segment");
    const { result, store } = renderHook(() => useReleaseNotesViewModel());

    act(() => {
      store.dispatch(openReleaseNotes());
    });
    track.mockClear();

    act(() => {
      result.current.onGotIt();
    });

    expect(track).toHaveBeenCalledWith("button_clicked", { button: "release_notes_got_it" });
    expect(result.current.isOpen).toBe(false);
  });

  it("should provide stable onClose and onGotIt references", () => {
    const { result, rerender } = renderHook(() => useReleaseNotesViewModel());

    const firstOnClose = result.current.onClose;
    const firstOnGotIt = result.current.onGotIt;
    rerender();
    expect(result.current.onClose).toBe(firstOnClose);
    expect(result.current.onGotIt).toBe(firstOnGotIt);
  });
});
