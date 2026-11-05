import { act, renderHook } from "@testing-library/react";
import type { KeyDisplayState } from "../../types";
import { useConfigEditor } from "./useConfigEditor";

const display: KeyDisplayState = {
  key: "config_currency_solana",
  resolved: { token2022Enabled: false },
  defaultValue: { token2022Enabled: false, status: "active" },
  valueType: "object",
  isOverridden: false,
};

describe("useConfigEditor", () => {
  it("should start from the resolved value, with nothing to apply", () => {
    const { result } = renderEditor();

    expect(result.current).toMatchObject({
      json: '{\n  "token2022Enabled": false\n}',
      isJsonValid: true,
      applyDisabled: true,
    });
  });

  it("should override the key with the parsed JSON, then follow the resolved value again", () => {
    const { result, setOverride } = renderEditor();

    act(() => result.current.setJson('{"token2022Enabled":true}'));
    expect(result.current.applyDisabled).toBe(false);
    act(() => result.current.apply());

    expect(setOverride).toHaveBeenCalledWith("config_currency_solana", { token2022Enabled: true });
    expect(result.current.json).toBe('{\n  "token2022Enabled": false\n}');
  });

  it("should flag invalid JSON and refuse to apply it", () => {
    const { result, setOverride } = renderEditor();

    act(() => result.current.setJson("{not json"));
    act(() => result.current.apply());

    expect(result.current.isJsonValid).toBe(false);
    expect(result.current.applyDisabled).toBe(true);
    expect(setOverride).not.toHaveBeenCalled();
  });

  it("should not apply JSON equal to the resolved value, whatever its formatting", () => {
    const { result } = renderEditor();

    act(() => result.current.setJson('{"token2022Enabled": false}'));

    expect(result.current.applyDisabled).toBe(true);
  });

  it("should clear the override and the draft on restore", () => {
    const { result, clearOverride } = renderEditor();
    act(() => result.current.setJson("{}"));

    act(() => result.current.restore());

    expect(clearOverride).toHaveBeenCalledWith("config_currency_solana");
    expect(result.current.json).toBe('{\n  "token2022Enabled": false\n}');
  });

  it("should not diff while the JSON view is shown", () => {
    const { result } = renderEditor();

    expect(result.current.diffJson).toEqual([]);
  });

  it("should diff against the default value, or the resolved one", () => {
    const { result } = renderEditor();
    act(() => result.current.setView("review"));

    expect(result.current.diffJson).toContainEqual({
      state: "removed",
      text: '  "status": "active"',
    });

    act(() => result.current.setDiffBaseline("resolved"));
    expect(result.current.diffJson.every(line => line.state === "none")).toBe(true);
  });
});

function renderEditor() {
  const setOverride = jest.fn();
  const clearOverride = jest.fn();
  const rendered = renderHook(() => useConfigEditor({ display, setOverride, clearOverride }));
  return { ...rendered, setOverride, clearOverride };
}
