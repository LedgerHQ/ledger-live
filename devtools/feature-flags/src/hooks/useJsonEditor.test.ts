import { act, renderHook } from "@testing-library/react";
import type { FeatureId, Features } from "@shared/feature-flags";
import { useJsonEditor } from "./useJsonEditor";
import type { JsonEditorProps } from "./useJsonEditor";

const testFlagId: FeatureId = "mockFeature";
const resolved: Features[FeatureId] = { enabled: true };
const resolvedJson = JSON.stringify(resolved, null, 2);

const makeProps = (overrides: Partial<JsonEditorProps> = {}): JsonEditorProps => ({
  id: testFlagId,
  resolved,
  setOverride: jest.fn(),
  ...overrides,
});

describe("useJsonEditor", () => {
  describe("currentJsonFlag", () => {
    it("defaults to the resolved value, stringified", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      expect(result.current.currentJsonFlag).toBe(resolvedJson);
    });

    it("reflects the draft once set", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setCurrentJsonFlag('{ "enabled": false }'));
      expect(result.current.currentJsonFlag).toBe('{ "enabled": false }');
    });
  });

  describe("isJsonValid", () => {
    it("is true for parseable JSON", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setCurrentJsonFlag('{ "enabled": false }'));
      expect(result.current.isJsonValid).toBe(true);
    });

    it("is false for unparseable JSON", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setCurrentJsonFlag("{ not json"));
      expect(result.current.isJsonValid).toBe(false);
    });
  });

  describe("diffBaseline", () => {
    it("defaults to 'default'", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      expect(result.current.diffBaseline).toBe("default");
    });

    it("can be switched to 'resolved'", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setDiffBaseline("resolved"));
      expect(result.current.diffBaseline).toBe("resolved");
    });
  });

  describe("diffJson", () => {
    it("highlights removed and added lines in the diff", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      const expected = result.current.diffJson;
      expect(expected.some(l => l.state === "removed" && l.text.includes("false"))).toBe(true);
      expect(expected.some(l => l.state === "added" && l.text.includes("true"))).toBe(true);
    });

    it("resets the state of every line when the diff is resolved", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setDiffBaseline("resolved"));
      expect(result.current.diffJson.every(l => l.state === "none")).toBe(true);
    });
  });

  describe("overrideWithJson", () => {
    it("applies the parsed value via setOverride", () => {
      const setOverride = jest.fn();
      const { result } = renderHook(() => useJsonEditor(makeProps({ setOverride })));
      act(() => result.current.setCurrentJsonFlag('{ "enabled": false }'));
      act(() => result.current.overrideWithJson());
      expect(setOverride).toHaveBeenCalledWith(testFlagId, { enabled: false });
    });

    it("clears the draft after applying", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setCurrentJsonFlag('{ "enabled": false }'));
      act(() => result.current.overrideWithJson());
      expect(result.current.currentJsonFlag).toBe(resolvedJson);
    });

    it("does not call setOverride when the draft is invalid", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      const setOverride = jest.fn();
      const { result } = renderHook(() => useJsonEditor(makeProps({ setOverride })));
      act(() => result.current.setCurrentJsonFlag("{ not json"));
      act(() => result.current.overrideWithJson());
      expect(setOverride).not.toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith("Invalid JSON", "{ not json");
      consoleError.mockRestore();
    });
  });

  describe("resetJson", () => {
    it("discards the draft and falls back to the resolved value", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setCurrentJsonFlag('{ "enabled": false }'));
      act(() => result.current.resetJson());
      expect(result.current.currentJsonFlag).toBe(resolvedJson);
    });
  });

  describe("applyDisabled", () => {
    it("is true when the current value equals resolved", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      expect(result.current.applyDisabled).toBe(true);
    });

    it("is true when the draft is invalid", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setCurrentJsonFlag("{ not json"));
      expect(result.current.applyDisabled).toBe(true);
    });

    it("is false when the value is valid and differs from resolved", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.setCurrentJsonFlag('{ "enabled": false }'));
      expect(result.current.applyDisabled).toBe(false);
    });
  });

  describe("toggleFeatureFlag", () => {
    it("overrides with the toggled enabled value", () => {
      const setOverride = jest.fn();
      const { result } = renderHook(() => useJsonEditor(makeProps({ setOverride })));
      act(() => result.current.toggleFeatureFlag(false));
      expect(setOverride).toHaveBeenCalledWith(testFlagId, { enabled: false });
    });

    it("writes the toggled value into the draft", () => {
      const { result } = renderHook(() => useJsonEditor(makeProps()));
      act(() => result.current.toggleFeatureFlag(false));
      expect(result.current.currentJsonFlag).toBe(JSON.stringify({ enabled: false }, null, 2));
    });
  });
});
