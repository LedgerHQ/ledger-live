/**
 * @jest-environment jsdom
 */
import { renderHook, act } from "@testing-library/react";
import { useDisclaimerRaw } from "../useDisclaimerRaw";
import { createAppManifest } from "../../logic/__tests__/testHelpers";
import type { AppManifest } from "../../types";

function createUiHook() {
  return {
    prompt: jest.fn(),
    dismiss: jest.fn(),
    openApp: jest.fn(),
    close: jest.fn(),
  };
}

function setup(
  overrides?: Partial<{
    isReadOnly: boolean;
    isDismissed: boolean;
    appendRecentlyUsed: (m: AppManifest) => void;
    uiHook: ReturnType<typeof createUiHook>;
  }>,
) {
  const uiHook = overrides?.uiHook ?? createUiHook();
  const appendRecentlyUsed = overrides?.appendRecentlyUsed ?? jest.fn();
  const { result } = renderHook(() =>
    useDisclaimerRaw({
      isReadOnly: overrides?.isReadOnly ?? false,
      isDismissed: overrides?.isDismissed ?? false,
      appendRecentlyUsed,
      uiHook,
    }),
  );
  return { result, uiHook, appendRecentlyUsed };
}

describe("useDisclaimerRaw", () => {
  describe("onSelect", () => {
    it("does nothing when manifest branch is 'soon'", () => {
      const { result, uiHook, appendRecentlyUsed } = setup();
      const manifest = createAppManifest();
      manifest.branch = "soon";

      act(() => result.current.onSelect(manifest));

      expect(uiHook.prompt).not.toHaveBeenCalled();
      expect(uiHook.openApp).not.toHaveBeenCalled();
      expect(appendRecentlyUsed).not.toHaveBeenCalled();
    });

    it("prompts when not dismissed, not read-only and author is not ledger", () => {
      const { result, uiHook } = setup({ isDismissed: false, isReadOnly: false });
      const manifest = createAppManifest();
      manifest.author = "third-party";

      act(() => result.current.onSelect(manifest));

      expect(uiHook.prompt).toHaveBeenCalledWith(manifest, expect.any(Function));
      expect(uiHook.openApp).not.toHaveBeenCalled();
    });

    it("opens directly when already dismissed", () => {
      const { result, uiHook, appendRecentlyUsed } = setup({ isDismissed: true });
      const manifest = createAppManifest();
      manifest.author = "third-party";

      act(() => result.current.onSelect(manifest));

      expect(uiHook.prompt).not.toHaveBeenCalled();
      expect(appendRecentlyUsed).toHaveBeenCalledWith(manifest);
      expect(uiHook.openApp).toHaveBeenCalledWith(manifest);
    });

    it("opens directly when read-only", () => {
      const { result, uiHook, appendRecentlyUsed } = setup({ isReadOnly: true });
      const manifest = createAppManifest();
      manifest.author = "third-party";

      act(() => result.current.onSelect(manifest));

      expect(uiHook.prompt).not.toHaveBeenCalled();
      expect(appendRecentlyUsed).toHaveBeenCalledWith(manifest);
      expect(uiHook.openApp).toHaveBeenCalledWith(manifest);
    });

    it("opens directly when author is ledger", () => {
      const { result, uiHook, appendRecentlyUsed } = setup();
      const manifest = createAppManifest();
      manifest.author = "ledger";

      act(() => result.current.onSelect(manifest));

      expect(uiHook.prompt).not.toHaveBeenCalled();
      expect(appendRecentlyUsed).toHaveBeenCalledWith(manifest);
      expect(uiHook.openApp).toHaveBeenCalledWith(manifest);
    });
  });

  describe("onConfirm", () => {
    it("returns early when manifest is falsy", () => {
      const { result, uiHook, appendRecentlyUsed } = setup();

      act(() => result.current.onConfirm(undefined as unknown as AppManifest, true));

      expect(uiHook.dismiss).not.toHaveBeenCalled();
      expect(uiHook.close).not.toHaveBeenCalled();
      expect(appendRecentlyUsed).not.toHaveBeenCalled();
    });

    it("dismisses when isChecked is true, then closes, appends and opens", () => {
      const { result, uiHook, appendRecentlyUsed } = setup();
      const manifest = createAppManifest();

      act(() => result.current.onConfirm(manifest, true));

      expect(uiHook.dismiss).toHaveBeenCalledTimes(1);
      expect(uiHook.close).toHaveBeenCalledTimes(1);
      expect(appendRecentlyUsed).toHaveBeenCalledWith(manifest);
      expect(uiHook.openApp).toHaveBeenCalledWith(manifest);
    });

    it("does not dismiss when isChecked is false", () => {
      const { result, uiHook, appendRecentlyUsed } = setup();
      const manifest = createAppManifest();

      act(() => result.current.onConfirm(manifest, false));

      expect(uiHook.dismiss).not.toHaveBeenCalled();
      expect(uiHook.close).toHaveBeenCalledTimes(1);
      expect(appendRecentlyUsed).toHaveBeenCalledWith(manifest);
      expect(uiHook.openApp).toHaveBeenCalledWith(manifest);
    });
  });
});
