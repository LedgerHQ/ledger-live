import { act, renderHook } from "tests/testSetup";
import { useRestoreFocusOnDialogClose } from "./useRestoreFocusOnDialogClose";

describe("useRestoreFocusOnDialogClose", () => {
  let nextFrame: FrameRequestCallback | undefined;
  let requestAnimationFrameSpy: jest.SpyInstance;

  beforeEach(() => {
    requestAnimationFrameSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation(callback => {
        nextFrame = callback;
        return 0;
      });
  });

  afterEach(() => {
    document.body.replaceChildren();
    requestAnimationFrameSpy.mockRestore();
    nextFrame = undefined;
  });

  it("restores focus to the element active before the overlay opened", () => {
    const origin = document.createElement("button");
    const overlay = document.createElement("div");
    const overlayInput = document.createElement("input");
    document.body.append(origin, overlay);
    overlay.appendChild(overlayInput);
    origin.focus();

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());
    overlayInput.focus();

    const preventDefault = jest.fn();
    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault,
        currentTarget: overlay,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(origin);
  });

  it("does not steal focus from a newer overlay", () => {
    const origin = document.createElement("button");
    const closingOverlay = document.createElement("div");
    const newerOverlayInput = document.createElement("input");
    document.body.append(origin, closingOverlay, newerOverlayInput);
    origin.focus();

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());
    newerOverlayInput.focus();

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: closingOverlay,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(document.activeElement).toBe(newerOverlayInput);
  });

  it("restores focus when the closing overlay leaves focus on the document body", () => {
    const origin = document.createElement("button");
    const overlayInput = document.createElement("input");
    document.body.append(origin, overlayInput);
    origin.focus();

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());
    overlayInput.focus();
    overlayInput.remove();

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: null,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(document.activeElement).toBe(origin);
  });

  it("leaves the origin alone when it never lost focus", () => {
    const origin = document.createElement("button");
    document.body.appendChild(origin);
    origin.focus();
    const focusSpy = jest.spyOn(origin, "focus");

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: null,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(focusSpy).not.toHaveBeenCalled();
  });

  // Clicking inside a webview leaves the embedder's active element on the body,
  // so there is no origin to restore — and the guest cannot claim keyboard focus
  // back on its own.
  it("hands focus to the webview when the dialog was opened from a live app", () => {
    const webview = document.createElement("webview");
    document.body.appendChild(webview);
    const focusSpy = jest.spyOn(webview, "focus");

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: null,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it("hands focus to the webview when the origin is gone", () => {
    const origin = document.createElement("button");
    const webview = document.createElement("webview");
    document.body.append(origin, webview);
    origin.focus();
    const focusSpy = jest.spyOn(webview, "focus");

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());
    origin.remove();

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: null,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  // A webview rendered inside the dialog dies with it, and focusing a guest whose
  // webContents is gone crashes.
  it("skips the webview that is closing along with the dialog", () => {
    const closingOverlay = document.createElement("div");
    const hostWebview = document.createElement("webview");
    const dialogWebview = document.createElement("webview");
    document.body.append(hostWebview, closingOverlay);
    closingOverlay.appendChild(dialogWebview);
    const hostFocusSpy = jest.spyOn(hostWebview, "focus");
    const dialogFocusSpy = jest.spyOn(dialogWebview, "focus");

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: closingOverlay,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(dialogFocusSpy).not.toHaveBeenCalled();
    expect(hostFocusSpy).toHaveBeenCalledTimes(1);
  });

  it("skips a webview whose guest is already detached", () => {
    const detachedGuest = document.createElement("webview");
    const liveWebview = document.createElement("webview");
    document.body.append(liveWebview, detachedGuest);
    Object.assign(detachedGuest, {
      getWebContentsId: () => {
        throw new Error("The WebView must be attached to the DOM");
      },
    });
    const detachedFocusSpy = jest.spyOn(detachedGuest, "focus");
    const liveFocusSpy = jest.spyOn(liveWebview, "focus");

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: null,
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(detachedFocusSpy).not.toHaveBeenCalled();
    expect(liveFocusSpy).toHaveBeenCalledTimes(1);
  });

  it("does not wake the webview while a newer overlay holds focus", () => {
    const webview = document.createElement("webview");
    const newerOverlayInput = document.createElement("input");
    document.body.append(webview, newerOverlayInput);
    const focusSpy = jest.spyOn(webview, "focus");

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());
    newerOverlayInput.focus();

    act(() => {
      result.current.onCloseAutoFocus({
        preventDefault: jest.fn(),
        currentTarget: document.createElement("div"),
      } as unknown as Event);
      nextFrame?.(0);
    });

    expect(focusSpy).not.toHaveBeenCalled();
  });

  it("does nothing when the focus origin is not an HTML element", () => {
    const svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const activeElementSpy = jest
      .spyOn(document, "activeElement", "get")
      .mockReturnValue(svgElement);
    const { result } = renderHook(() => useRestoreFocusOnDialogClose());

    act(() => result.current.onOpenAutoFocus());
    activeElementSpy.mockRestore();

    expect(() => {
      act(() => {
        result.current.onCloseAutoFocus({
          preventDefault: jest.fn(),
          currentTarget: null,
        } as unknown as Event);
        nextFrame?.(0);
      });
    }).not.toThrow();
  });

  it("does not restore focus when the origin was removed", () => {
    const origin = document.createElement("button");
    document.body.appendChild(origin);
    origin.focus();

    const { result } = renderHook(() => useRestoreFocusOnDialogClose());
    act(() => result.current.onOpenAutoFocus());
    origin.remove();

    expect(() => {
      act(() => {
        result.current.onCloseAutoFocus({
          preventDefault: jest.fn(),
          currentTarget: null,
        } as unknown as Event);
        nextFrame?.(0);
      });
    }).not.toThrow();
  });
});
