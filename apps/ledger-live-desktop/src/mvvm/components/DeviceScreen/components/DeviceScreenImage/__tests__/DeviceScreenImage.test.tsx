import React from "react";
import { fireEvent, render, screen } from "tests/testSetup";
import { DeviceScreenImage } from "../index";

/**
 * jsdom ships no PointerEvent, and the fallback it leaves carries no
 * coordinates — which are the whole point of these tests. MouseEvent has them.
 */
class PointerEventPolyfill extends MouseEvent {
  readonly pointerId: number;

  constructor(type: string, props: PointerEventInit = {}) {
    super(type, props);
    this.pointerId = props.pointerId ?? 0;
  }
}
window.PointerEvent = PointerEventPolyfill as unknown as typeof window.PointerEvent;

const NATURAL_WIDTH = 400;
const NATURAL_HEIGHT = 672;
/** Rendered twice as large as the frame, so CSS pixels are not device pixels. */
const RENDERED = { left: 100, top: 50, width: 800, height: 1344 };

/**
 * jsdom decodes nothing and lays nothing out, so the frame's own dimensions and
 * its box on screen — the two inputs of the touch mapping — are stubbed.
 */
const renderImage = (onTouch?: jest.Mock) => {
  const utils = render(<DeviceScreenImage src="blob:screenshot" onTouch={onTouch} />);
  const image = screen.getByTestId("device-screen-image");

  Object.defineProperty(image, "naturalWidth", { value: NATURAL_WIDTH, configurable: true });
  Object.defineProperty(image, "naturalHeight", { value: NATURAL_HEIGHT, configurable: true });
  image.getBoundingClientRect = () => ({
    ...RENDERED,
    right: 0,
    bottom: 0,
    x: 0,
    y: 0,
    toJSON: () => "",
  });
  // jsdom does not implement pointer capture.
  image.setPointerCapture = jest.fn();
  image.releasePointerCapture = jest.fn();

  return { ...utils, image };
};

describe("DeviceScreenImage", () => {
  it("maps a tap to device pixels, not css pixels", () => {
    const onTouch = jest.fn();
    const { image } = renderImage(onTouch);

    // Centre of the rendered box.
    fireEvent.pointerDown(image, { pointerId: 1, clientX: 500, clientY: 722 });

    expect(onTouch).toHaveBeenCalledWith(NATURAL_WIDTH / 2, NATURAL_HEIGHT / 2, "press");
  });

  it("releases on the spot the press landed on, not where the pointer went up", () => {
    const onTouch = jest.fn();
    const { image } = renderImage(onTouch);

    fireEvent.pointerDown(image, { pointerId: 1, clientX: 500, clientY: 722 });
    fireEvent.pointerUp(image, { pointerId: 1, clientX: 900, clientY: 1500 });

    expect(onTouch).toHaveBeenLastCalledWith(NATURAL_WIDTH / 2, NATURAL_HEIGHT / 2, "release");
    expect(image.releasePointerCapture).toHaveBeenCalledWith(1);
  });

  it("clamps a tap on the far edge into the screen", () => {
    const onTouch = jest.fn();
    const { image } = renderImage(onTouch);

    fireEvent.pointerDown(image, {
      pointerId: 1,
      clientX: RENDERED.left + RENDERED.width,
      clientY: RENDERED.top + RENDERED.height,
    });

    expect(onTouch).toHaveBeenCalledWith(NATURAL_WIDTH - 1, NATURAL_HEIGHT - 1, "press");
  });

  it("clamps a tap before the near edge into the screen", () => {
    const onTouch = jest.fn();
    const { image } = renderImage(onTouch);

    fireEvent.pointerDown(image, {
      pointerId: 1,
      clientX: RENDERED.left - 20,
      clientY: RENDERED.top - 20,
    });

    expect(onTouch).toHaveBeenCalledWith(0, 0, "press");
  });

  it("treats a cancelled pointer as a release", () => {
    const onTouch = jest.fn();
    const { image } = renderImage(onTouch);

    fireEvent.pointerDown(image, { pointerId: 1, clientX: 500, clientY: 722 });
    fireEvent.pointerCancel(image, { pointerId: 1 });

    expect(onTouch).toHaveBeenLastCalledWith(NATURAL_WIDTH / 2, NATURAL_HEIGHT / 2, "release");
  });

  it("ignores a second press while one is held", () => {
    const onTouch = jest.fn();
    const { image } = renderImage(onTouch);

    fireEvent.pointerDown(image, { pointerId: 1, clientX: 500, clientY: 722 });
    fireEvent.pointerDown(image, { pointerId: 2, clientX: 200, clientY: 100 });

    expect(onTouch).toHaveBeenCalledTimes(1);
  });

  it("releases a held finger when it unmounts mid-hold", () => {
    const onTouch = jest.fn();
    const { image, unmount } = renderImage(onTouch);

    fireEvent.pointerDown(image, { pointerId: 1, clientX: 500, clientY: 722 });
    unmount();

    expect(onTouch).toHaveBeenLastCalledWith(NATURAL_WIDTH / 2, NATURAL_HEIGHT / 2, "release");
  });

  it("sends nothing on a device that is not tappable", () => {
    const { image } = renderImage(undefined);

    fireEvent.pointerDown(image, { pointerId: 1, clientX: 500, clientY: 722 });

    expect(image.setPointerCapture).not.toHaveBeenCalled();
  });

  it("shows a fallback when the frame cannot be decoded", () => {
    const { image } = renderImage(jest.fn());

    fireEvent.error(image);

    expect(screen.getByTestId("device-screen-undecodable")).toBeVisible();
  });

  it("takes its aspect ratio from the frame's own dimensions", () => {
    const { image } = renderImage(jest.fn());

    fireEvent.load(image);

    expect(image.parentElement).toHaveStyle({
      aspectRatio: String(NATURAL_WIDTH / NATURAL_HEIGHT),
    });
  });
});
