import { act, renderHook } from "@tests/test-renderer";
import { Keyboard, Platform } from "react-native";
import { useKeyboardInset } from "./useKeyboardInset";

const WINDOW_HEIGHT = 800;

jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({ height: windowHeight, width: 400, scale: 2, fontScale: 1 }),
}));

let windowHeight = WINDOW_HEIGHT;

const listeners = new Map<string, (event: { endCoordinates: { screenY: number } }) => void>();

const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

beforeEach(() => {
  windowHeight = WINDOW_HEIGHT;
  listeners.clear();
  jest.spyOn(Keyboard, "metrics").mockReturnValue(undefined);
  jest.spyOn(Keyboard, "addListener").mockImplementation(((
    event: string,
    listener: (payload: { endCoordinates: { screenY: number } }) => void,
  ) => {
    listeners.set(event, listener);
    return { remove: jest.fn() };
  }) as unknown as typeof Keyboard.addListener);
});

afterEach(() => jest.restoreAllMocks());

const show = (keyboardTop: number, resizeTo?: number) =>
  act(() => {
    if (resizeTo !== undefined) {
      windowHeight = resizeTo;
    }
    listeners.get(showEvent)?.({ endCoordinates: { screenY: keyboardTop } });
  });

const hide = () =>
  act(() => {
    windowHeight = WINDOW_HEIGHT;
    listeners.get(hideEvent)?.({ endCoordinates: { screenY: WINDOW_HEIGHT } });
  });

describe("the keyboard inset", () => {
  it("is nothing while the keyboard is down", () => {
    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toBe(0);
  });

  it("is the gap left below the keyboard when the window keeps its height", () => {
    const { result } = renderHook(() => useKeyboardInset());

    show(500);

    expect(result.current).toBe(300);
  });

  it("is nothing when the window shrank to where the keyboard starts", () => {
    const { result } = renderHook(() => useKeyboardInset());

    show(500, 500);

    expect(result.current).toBe(0);
  });

  it("is the remainder when the window shrank by only part of the keyboard", () => {
    const { result } = renderHook(() => useKeyboardInset());

    show(500, 650);

    expect(result.current).toBe(150);
  });

  it("pads a screen that mounts with the keyboard already up", () => {
    jest.spyOn(Keyboard, "metrics").mockReturnValue({
      screenY: 500,
      screenX: 0,
      width: 400,
      height: 300,
    });

    const { result } = renderHook(() => useKeyboardInset());

    expect(result.current).toBe(300);
  });

  it("goes back to nothing on dismissal, leaving no padding behind", () => {
    const { result } = renderHook(() => useKeyboardInset());

    show(500);
    hide();

    expect(result.current).toBe(0);
  });
});
