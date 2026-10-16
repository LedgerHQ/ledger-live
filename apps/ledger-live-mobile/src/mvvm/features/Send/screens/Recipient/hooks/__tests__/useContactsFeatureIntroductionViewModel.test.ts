import { act, renderHook } from "@tests/test-renderer";
import { useContactsFeatureIntroductionViewModel } from "../useContactsFeatureIntroductionViewModel";

function renderViewModel({
  isContactsEntryAvailable = true,
  isDismissed = false,
  onClose,
}: {
  isContactsEntryAvailable?: boolean;
  isDismissed?: boolean;
  onClose?: () => void;
} = {}) {
  return renderHook(
    () => useContactsFeatureIntroductionViewModel({ isContactsEntryAvailable, onClose }),
    {
      overrideInitialState: state => ({
        ...state,
        settings: { ...state.settings, hasDismissedContactsFeatureIntroduction: isDismissed },
      }),
    },
  );
}

describe("useContactsFeatureIntroductionViewModel", () => {
  it("should open on a first visit", () => {
    const { result } = renderViewModel();

    expect(result.current.isOpen).toBe(true);
  });

  it("should stay closed when the introduction was already dismissed", () => {
    const { result } = renderViewModel({ isDismissed: true });

    expect(result.current.isOpen).toBe(false);
  });

  it("should stay closed when the contacts entry is not available", () => {
    const { result } = renderViewModel({ isContactsEntryAvailable: false });

    expect(result.current.isOpen).toBe(false);
  });

  it("should persist the dismissal on completion", () => {
    const { result, store } = renderViewModel();

    act(() => result.current.onComplete());

    expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(true);
    expect(result.current.isOpen).toBe(false);
  });

  it("should dismiss by default on close", () => {
    const { result, store } = renderViewModel();

    act(() => result.current.onClose());

    expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(true);
  });

  it("should delegate to the provided onClose instead of dismissing", () => {
    const onClose = jest.fn();
    const { result, store } = renderViewModel({ onClose });

    act(() => result.current.onClose());

    expect(onClose).toHaveBeenCalled();
    expect(store.getState().settings.hasDismissedContactsFeatureIntroduction).toBe(false);
  });
});
