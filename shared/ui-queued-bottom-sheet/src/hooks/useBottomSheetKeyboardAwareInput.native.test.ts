import { act, renderHook } from "@testing-library/react-native";
import type { NativeSyntheticEvent, TargetedEvent, TextInput } from "react-native";
import { useBottomSheetKeyboardAwareInput } from "./useBottomSheetKeyboardAwareInput";

type FakeInput = Readonly<{ node: number }>;

const NAME_FIELD: FakeInput = { node: 11 };
const OTHER_FIELD: FakeInput = { node: 22 };

let focusedInput: FakeInput | null = null;

jest.mock("react-native", () => ({
  findNodeHandle: (input: FakeInput | null) => input?.node ?? null,
  TextInput: { State: { currentlyFocusedInput: () => focusedInput } },
}));

type KeyboardState = { target: number | undefined; height: number };

let keyboardState: KeyboardState = { target: undefined, height: 0 };
let textInputNodes = new Set<number>();
let isInsideSheet = true;

jest.mock("@gorhom/bottom-sheet", () => ({
  useBottomSheetInternal: () =>
    isInsideSheet
      ? {
          animatedKeyboardState: {
            get: () => keyboardState,
            set: (next: KeyboardState) => {
              keyboardState = next;
            },
          },
          textInputNodesRef: { current: textInputNodes },
        }
      : null,
}));

function renderForField(field: FakeInput | null) {
  return renderHook(() =>
    useBottomSheetKeyboardAwareInput({ current: field as unknown as TextInput | null }),
  );
}

function focusEvent(node: number): NativeSyntheticEvent<TargetedEvent> {
  return { nativeEvent: { target: node } } as NativeSyntheticEvent<TargetedEvent>;
}

describe("useBottomSheetKeyboardAwareInput", () => {
  beforeEach(() => {
    focusedInput = null;
    keyboardState = { target: undefined, height: 0 };
    textInputNodes = new Set<number>();
    isInsideSheet = true;
  });

  it("should tell the sheet which field gained focus", () => {
    const { result } = renderForField(NAME_FIELD);

    act(() => result.current.onFocus(focusEvent(NAME_FIELD.node)));

    expect(keyboardState.target).toBe(NAME_FIELD.node);
  });

  it("should register the field so focus can move within the sheet", () => {
    renderForField(NAME_FIELD);

    expect(textInputNodes.has(NAME_FIELD.node)).toBe(true);
  });

  it("should release the keyboard and deregister the field on unmount", () => {
    const { result, unmount } = renderForField(NAME_FIELD);
    act(() => result.current.onFocus(focusEvent(NAME_FIELD.node)));

    unmount();

    expect(keyboardState.target).toBeUndefined();
    expect(textInputNodes.has(NAME_FIELD.node)).toBe(false);
  });

  it("should leave a keyboard claimed by another field alone on unmount", () => {
    const { unmount } = renderForField(NAME_FIELD);
    keyboardState = { target: OTHER_FIELD.node, height: 300 };

    unmount();

    expect(keyboardState.target).toBe(OTHER_FIELD.node);
  });

  it("should release the keyboard when focus leaves the sheet", () => {
    const { result } = renderForField(NAME_FIELD);
    act(() => result.current.onFocus(focusEvent(NAME_FIELD.node)));

    act(() => result.current.onBlur(focusEvent(NAME_FIELD.node)));

    expect(keyboardState.target).toBeUndefined();
  });

  it("should preserve the keyboard when focus moves to another field in the sheet", () => {
    const nameField = renderForField(NAME_FIELD);
    renderForField(OTHER_FIELD);
    act(() => nameField.result.current.onFocus(focusEvent(NAME_FIELD.node)));
    focusedInput = OTHER_FIELD;

    act(() => nameField.result.current.onBlur(focusEvent(NAME_FIELD.node)));

    expect(keyboardState.target).toBe(NAME_FIELD.node);
  });

  it("should do nothing outside a bottom sheet", () => {
    isInsideSheet = false;
    const { result } = renderForField(NAME_FIELD);

    act(() => result.current.onFocus(focusEvent(NAME_FIELD.node)));

    expect(keyboardState.target).toBeUndefined();
    expect(textInputNodes.size).toBe(0);
  });
});
