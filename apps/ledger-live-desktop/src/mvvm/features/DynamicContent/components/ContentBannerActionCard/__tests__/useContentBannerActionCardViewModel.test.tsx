import React from "react";

import { act, renderHook } from "tests/testSetup";
import { useContentBannerActionCardViewModel } from "../useContentBannerActionCardViewModel";

describe("useContentBannerActionCardViewModel", () => {
  const baseProps = {
    title: "Title",
    onClose: jest.fn(),
    onClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should set hasImageBackground when image_background is non-empty", () => {
    const { result } = renderHook(() =>
      useContentBannerActionCardViewModel({
        ...baseProps,
        image_background: "https://example.com/a.png",
      }),
    );
    expect(result.current.hasImageBackground).toBe(true);
    expect(result.current.imageUrl).toBe("https://example.com/a.png");
  });

  it("should not call onClick when handleMediaBannerClick originates from a button", () => {
    const { result } = renderHook(() =>
      useContentBannerActionCardViewModel({
        ...baseProps,
        image_background: "https://example.com/a.png",
      }),
    );

    const button = document.createElement("button");
    document.body.appendChild(button);
    const ev = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(ev, "target", { value: button, enumerable: true });

    act(() => {
      result.current.handleMediaBannerClick(
        ev as unknown as React.MouseEvent<HTMLDivElement>,
      );
    });

    expect(baseProps.onClick).not.toHaveBeenCalled();
    document.body.removeChild(button);
  });

  it("should call onClick when handleMediaBannerClick target is not inside a button", () => {
    const { result } = renderHook(() =>
      useContentBannerActionCardViewModel({
        ...baseProps,
        image_background: "https://example.com/a.png",
      }),
    );

    const span = document.createElement("span");
    document.body.appendChild(span);
    const ev = new MouseEvent("click", { bubbles: true });
    Object.defineProperty(ev, "target", { value: span, enumerable: true });

    act(() => {
      result.current.handleMediaBannerClick(
        ev as unknown as React.MouseEvent<HTMLDivElement>,
      );
    });

    expect(baseProps.onClick).toHaveBeenCalledTimes(1);
    document.body.removeChild(span);
  });
});
