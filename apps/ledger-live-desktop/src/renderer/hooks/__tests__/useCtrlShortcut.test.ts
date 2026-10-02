import { fireEvent, renderHook } from "tests/testSetup";
import { useCtrlShortcut } from "../useCtrlShortcut";

const keyUp = (target: Element | Document, init: KeyboardEventInit) =>
  fireEvent.keyUp(target, init);

describe("useCtrlShortcut", () => {
  it("triggers on ctrl+key keyup", () => {
    const onTrigger = jest.fn();
    renderHook(() => useCtrlShortcut("e", onTrigger, true));

    keyUp(document.body, { key: "e", ctrlKey: true });

    expect(onTrigger).toHaveBeenCalledTimes(1);
  });

  it("ignores the key without ctrl, other keys and keydown", () => {
    const onTrigger = jest.fn();
    renderHook(() => useCtrlShortcut("e", onTrigger, true));

    keyUp(document.body, { key: "e" });
    keyUp(document.body, { key: "r", ctrlKey: true });
    fireEvent.keyDown(document.body, { key: "e", ctrlKey: true });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const onTrigger = jest.fn();
    renderHook(() => useCtrlShortcut("e", onTrigger, false));

    keyUp(document.body, { key: "e", ctrlKey: true });

    expect(onTrigger).not.toHaveBeenCalled();
  });

  it.each([
    ["input", () => document.createElement("input")],
    ["textarea", () => document.createElement("textarea")],
    [
      "contenteditable element",
      () => {
        const el = document.createElement("div");
        el.setAttribute("contenteditable", "true");
        return el;
      },
    ],
  ])("ignores events typed in a %s", (_name, create) => {
    const onTrigger = jest.fn();
    const target = document.body.appendChild(create());
    renderHook(() => useCtrlShortcut("e", onTrigger, true));

    keyUp(target, { key: "e", ctrlKey: true });

    expect(onTrigger).not.toHaveBeenCalled();
    target.remove();
  });

  it("calls the latest handler and stops listening on unmount", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { rerender, unmount } = renderHook(
      ({ onTrigger }) => useCtrlShortcut("e", onTrigger, true),
      { initialProps: { onTrigger: first } },
    );

    rerender({ onTrigger: second });
    keyUp(document.body, { key: "e", ctrlKey: true });
    unmount();
    keyUp(document.body, { key: "e", ctrlKey: true });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
