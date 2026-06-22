import { renderHook } from "@tests/test-renderer";
import { InteractionManager, Platform } from "react-native";
import { useAutoFocusOnEnter } from "../useAutoFocusOnEnter";

const mockAddListener = jest.fn();
const mockGetParent = jest.fn();

jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useNavigation: () => ({ addListener: mockAddListener, getParent: mockGetParent }),
}));

const makeRef = (focus: jest.Mock) => ({ current: { focus } });

type TransitionEndHandler = (e: { data: { closing: boolean } }) => void;

describe("useAutoFocusOnEnter", () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    mockGetParent.mockReturnValue(undefined);
    mockAddListener.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    Platform.OS = originalOS;
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe("on iOS", () => {
    beforeEach(() => {
      Platform.OS = "ios";
    });

    it("focuses via InteractionManager, without a transition listener", () => {
      const runAfterInteractions = jest.spyOn(InteractionManager, "runAfterInteractions");

      renderHook(() => useAutoFocusOnEnter(makeRef(jest.fn())));

      expect(runAfterInteractions).toHaveBeenCalledTimes(1);
      expect(mockAddListener).not.toHaveBeenCalled();
    });
  });

  describe("on Android", () => {
    beforeEach(() => {
      Platform.OS = "android";
    });

    it("focuses once when the enter transition ends, then unsubscribes", () => {
      const focus = jest.fn();
      const unsubscribe = jest.fn();
      let handler: TransitionEndHandler = () => {};
      mockAddListener.mockImplementation((event: string, cb: TransitionEndHandler) => {
        if (event === "transitionEnd") handler = cb;
        return unsubscribe;
      });

      renderHook(() => useAutoFocusOnEnter(makeRef(focus)));

      expect(mockAddListener).toHaveBeenCalledWith("transitionEnd", expect.any(Function));
      expect(focus).not.toHaveBeenCalled();

      handler({ data: { closing: false } });

      expect(focus).toHaveBeenCalledTimes(1);
      expect(unsubscribe).toHaveBeenCalled();
    });

    it("does not focus while the screen is closing", () => {
      const focus = jest.fn();
      let handler: TransitionEndHandler = () => {};
      mockAddListener.mockImplementation((_event: string, cb: TransitionEndHandler) => {
        handler = cb;
        return jest.fn();
      });

      renderHook(() => useAutoFocusOnEnter(makeRef(focus)));
      handler({ data: { closing: true } });

      expect(focus).not.toHaveBeenCalled();
    });

    it("listens on the parent stack (where the transition runs) when present", () => {
      const parentAddListener = jest.fn(() => jest.fn());
      mockGetParent.mockReturnValue({ addListener: parentAddListener });

      renderHook(() => useAutoFocusOnEnter(makeRef(jest.fn())));

      expect(parentAddListener).toHaveBeenCalledWith("transitionEnd", expect.any(Function));
      expect(mockAddListener).not.toHaveBeenCalled();
    });

    it("unsubscribes from the transition listener on unmount", () => {
      const unsubscribe = jest.fn();
      mockAddListener.mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAutoFocusOnEnter(makeRef(jest.fn())));
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
