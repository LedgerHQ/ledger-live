import { act, renderHook } from "@testing-library/react";
import type { ConfigValueState } from "../../types";
import { useDevValueField } from "./useDevValueField";

const baseUrl = "https://api.stg.example.com";
const localUrl = "http://localhost:3000";
const rejectedDevValue = { value: "not a url", message: "Invalid URL" };

describe("useDevValueField", () => {
  it("should start from what the next session runs on, with no error", () => {
    const { result } = renderField(makeValue({ nextValue: localUrl, hasDevValue: true }));

    expect(result.current).toMatchObject({ draft: localUrl, error: undefined });
  });

  it("should start from a refused dev value, with why", () => {
    const { result } = renderField(makeValue({ rejectedDevValue }));

    expect(result.current).toMatchObject({ draft: "not a url", error: "Invalid URL" });
  });

  it.each([
    ["a new text", makeValue(), localUrl, "set"],
    ["the value the next session runs on", makeValue({ nextValue: localUrl }), localUrl, null],
    ["an empty text over a dev value", makeValue({ hasDevValue: true }), "", "remove"],
    ["the base value over a dev value", makeValue({ hasDevValue: true }), baseUrl, "remove"],
    ["the base value without a dev value", makeValue(), baseUrl, null],
    ["the base value after a refused one", makeValue({ rejectedDevValue }), baseUrl, "remove"],
    [
      "the next value after a refused one",
      makeValue({ nextValue: localUrl, rejectedDevValue }),
      localUrl,
      "set",
    ],
  ] as const)("should commit %s", (_, value, text, outcome) => {
    const { result, setDevValue, removeDevValue } = renderField(value);

    act(() => result.current.setDraft(text));
    act(() => result.current.commit());

    expect(setDevValue.mock.calls).toEqual(outcome === "set" ? [["apiBaseUrl", text]] : []);
    expect(removeDevValue.mock.calls).toEqual(outcome === "remove" ? [["apiBaseUrl"]] : []);
  });

  it("should tell whether the host took the committed draft", () => {
    const { result, setDevValue } = renderField(makeValue());
    let isSaved: boolean | undefined;

    act(() => result.current.setDraft(localUrl));
    act(() => {
      isSaved = result.current.commit();
    });
    expect(isSaved).toBe(true);

    setDevValue.mockReturnValue(false);
    act(() => result.current.setDraft("not a url"));
    act(() => {
      isSaved = result.current.commit();
    });
    expect(isSaved).toBe(false);
  });

  it("should hand a reload the commit of a changed draft until the draft is committed", () => {
    const { result, setDevValue, registerDraft, dropDraft } = renderField(makeValue());

    expect(registerDraft).not.toHaveBeenCalled();
    act(() => result.current.setDraft(localUrl));
    const [commitBeforeReload] = registerDraft.mock.lastCall ?? [];
    act(() => commitBeforeReload?.());

    expect(setDevValue).toHaveBeenCalledWith("apiBaseUrl", localUrl);
    expect(dropDraft).toHaveBeenCalled();
  });

  it("should keep handing a reload the commit of a refused draft", () => {
    const { setDevValue, registerDraft } = renderField(makeValue({ rejectedDevValue }));

    const [commitBeforeReload] = registerDraft.mock.lastCall ?? [];
    act(() => commitBeforeReload?.());

    expect(setDevValue).toHaveBeenCalledWith("apiBaseUrl", "not a url");
  });

  it("should show what the next session runs on again when a commit changes nothing", () => {
    const { result } = renderField(makeValue());

    act(() => result.current.setDraft(""));
    act(() => result.current.commit());

    expect(result.current.draft).toBe(baseUrl);
  });
});

function renderField(value: ConfigValueState) {
  const dropDraft = jest.fn();
  const actions = {
    setDevValue: jest.fn((_name: string, _value: string) => true),
    removeDevValue: jest.fn(),
    registerDraft: jest.fn((_commit: () => boolean) => dropDraft),
  };
  const view = renderHook(() => useDevValueField(value, actions));
  return { ...view, ...actions, dropDraft };
}

function makeValue(overrides: Partial<ConfigValueState> = {}): ConfigValueState {
  return {
    name: "apiBaseUrl",
    currentValue: baseUrl,
    nextValue: baseUrl,
    baseValue: baseUrl,
    hasDevValue: false,
    rejectedDevValue: undefined,
    ...overrides,
  };
}
