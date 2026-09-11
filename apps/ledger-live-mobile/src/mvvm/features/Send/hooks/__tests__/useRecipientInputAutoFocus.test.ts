import { renderHook } from "@testing-library/react-native";
import { InteractionManager, type TextInput } from "react-native";
import { useRecipientInputFocus } from "../../context/RecipientInputFocusContext";
import { useRecipientInputAutoFocus } from "../useRecipientInputAutoFocus";

jest.mock("../../context/RecipientInputFocusContext");

const mockedUseRecipientInputFocus = jest.mocked(useRecipientInputFocus);

function mockDecision(shouldFocusRecipientInput: boolean) {
  mockedUseRecipientInputFocus.mockReturnValue({
    shouldFocusRecipientInput,
    isRecipientInputFocusSettled: true,
    settleRecipientInputFocus: jest.fn(),
  });
}

function runInteractionsImmediately() {
  jest.spyOn(InteractionManager, "runAfterInteractions").mockImplementation(task => {
    if (typeof task === "function") task();
    return { done: jest.fn(), cancel: jest.fn() } as never;
  });
}

describe("useRecipientInputAutoFocus", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it("leaves the keyboard alone until the recipient step settled on focusing", () => {
    const runAfterInteractions = jest.spyOn(InteractionManager, "runAfterInteractions");
    mockDecision(false);

    renderHook(() => useRecipientInputAutoFocus(true));

    expect(runAfterInteractions).not.toHaveBeenCalled();
  });

  it("focuses the address input once the recipient step settled on focusing", () => {
    const focus = jest.fn();
    runInteractionsImmediately();
    mockDecision(false);

    const { result, rerender } = renderHook(() => useRecipientInputAutoFocus(true));
    result.current.current = { focus } as unknown as TextInput;

    mockDecision(true);
    rerender({});

    expect(focus).toHaveBeenCalledTimes(1);
  });

  it("does not focus while another step owns the header", () => {
    const runAfterInteractions = jest.spyOn(InteractionManager, "runAfterInteractions");
    mockDecision(true);

    renderHook(() => useRecipientInputAutoFocus(false));

    expect(runAfterInteractions).not.toHaveBeenCalled();
  });
});
