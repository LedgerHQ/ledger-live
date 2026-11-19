import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { TextEncoder } from "node:util";
import { AnimatedQrCode } from "./AnimatedQrCode";

// jsdom has no Encoding API: qrcode encodes the value with it.
globalThis.TextEncoder ??= TextEncoder as typeof globalThis.TextEncoder;

const ADDRESS = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";

const context = {
  setTransform: jest.fn(),
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  arcTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  arc: jest.fn(),
};

function mockReducedMotion(reduced: boolean) {
  window.matchMedia = jest.fn().mockReturnValue({
    matches: reduced,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
}

describe("AnimatedQrCode (Web)", () => {
  let requestFrame: jest.SpyInstance;

  beforeEach(() => {
    jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    requestFrame = jest.spyOn(window, "requestAnimationFrame").mockReturnValue(1);
    jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);
    mockReducedMotion(false);
  });

  afterEach(() => jest.restoreAllMocks());

  it("should draw the code without a frame loop while nothing moves", () => {
    render(<AnimatedQrCode value={ADDRESS} size={208} animation="ripple" testID="qr" />);

    expect(screen.getByTestId("qr")).toBeVisible();
    expect(context.arc).toHaveBeenCalled();
    expect(requestFrame).not.toHaveBeenCalled();
  });

  it("should keep a frame loop running while loading", () => {
    render(<AnimatedQrCode value="" size={208} animation="loading" />);

    expect(requestFrame).toHaveBeenCalled();
  });

  it("should call onPress and play the ripple when the code is clicked", () => {
    const onPress = jest.fn();
    render(
      <AnimatedQrCode
        value={ADDRESS}
        size={208}
        animation="ripple"
        onPress={onPress}
        accessibilityLabel="Copy address"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Copy address" }));

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(requestFrame).toHaveBeenCalled();
  });

  it("should replay the ripple on a new triggerKey, not on the first one", () => {
    const { rerender } = render(
      <AnimatedQrCode value={ADDRESS} size={208} animation="ripple" triggerKey={0} />,
    );
    expect(requestFrame).not.toHaveBeenCalled();

    rerender(<AnimatedQrCode value={ADDRESS} size={208} animation="ripple" triggerKey={1} />);

    expect(requestFrame).toHaveBeenCalled();
  });

  it("should draw the code still when the OS asks for reduced motion", () => {
    mockReducedMotion(true);
    render(<AnimatedQrCode value="" size={208} animation="loading" />);

    expect(context.arc).toHaveBeenCalled();
    expect(requestFrame).not.toHaveBeenCalled();
  });

  it("should show the center content once the code is known", () => {
    render(
      <AnimatedQrCode
        value={ADDRESS}
        size={208}
        animation="ripple"
        centerContent={<span>ETH icon</span>}
      />,
    );

    expect(screen.getByText("ETH icon")).toBeVisible();
  });
});
