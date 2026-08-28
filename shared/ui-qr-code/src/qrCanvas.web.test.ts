import qrcode from "qrcode";
import { drawStyledQrCode } from "./qrCanvas.web";

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

const mockCreate = qrcode.create as jest.Mock;

// Odd module count, like a real QR symbol, so the centered clear zone stays on-grid.
const MODULE_COUNT = 21;
const QR_SIZE = 200;

function createFakeCanvas() {
  const ctx = {
    setTransform: jest.fn(),
    clearRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    arcTo: jest.fn(),
    arc: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    fill: jest.fn(),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
  };
  const getContext = jest.fn(() => ctx);
  const canvas = { getContext, style: {} as Record<string, string>, width: 0, height: 0 };
  return { canvas: canvas as unknown as HTMLCanvasElement, ctx, getContext };
}

// Every module dark, so the number of drawn dots is fully determined by the finder and clear-zone
// exclusions rather than by the (mocked) QR contents.
function fullyDarkMatrix(count: number) {
  return { modules: { size: count, data: new Uint8Array(count * count).fill(1) } };
}

describe("drawStyledQrCode", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockReturnValue(fullyDarkMatrix(MODULE_COUNT));
  });

  it("encodes with high error correction so the overlay does not break scanning", () => {
    const { canvas } = createFakeCanvas();

    drawStyledQrCode(canvas, "0xabc123", QR_SIZE, false);

    expect(mockCreate).toHaveBeenCalledWith("0xabc123", { errorCorrectionLevel: "H" });
  });

  it("draws the three finder patterns", () => {
    const { canvas, ctx } = createFakeCanvas();

    drawStyledQrCode(canvas, "0xabc123", QR_SIZE, false);

    // One stroked rounded ring per finder (top-left, top-right, bottom-left).
    expect(ctx.stroke).toHaveBeenCalledTimes(3);
    expect(ctx.arc).toHaveBeenCalled();
  });

  it("uses the supplied foreground color for dots and finder patterns", () => {
    const { canvas, ctx } = createFakeCanvas();

    drawStyledQrCode(canvas, "0xabc123", QR_SIZE, false, "#000000");

    expect(ctx.fillStyle).toBe("#000000");
    expect(ctx.strokeStyle).toBe("#000000");
  });

  it("clears a centered, odd-sided square of modules only when there is center content", () => {
    const withoutCenter = createFakeCanvas();
    drawStyledQrCode(withoutCenter.canvas, "0xabc123", QR_SIZE, false);

    const withCenter = createFakeCanvas();
    drawStyledQrCode(withCenter.canvas, "0xabc123", QR_SIZE, true);

    const clearedDots =
      withoutCenter.ctx.arc.mock.calls.length - withCenter.ctx.arc.mock.calls.length;
    expect(clearedDots).toBeGreaterThan(0);

    // The cleared region is a square, and its side must be an odd number of modules to stay centered
    // on the (odd) grid — this locks the getClearCount parity adjustment.
    const side = Math.sqrt(clearedDots);
    expect(Number.isInteger(side)).toBe(true);
    expect(side % 2).toBe(1);
  });

  it("scales the canvas for the device pixel ratio", () => {
    const original = window.devicePixelRatio;
    Object.defineProperty(window, "devicePixelRatio", { value: 2, configurable: true });
    try {
      const { canvas, ctx } = createFakeCanvas();

      drawStyledQrCode(canvas, "0xabc123", QR_SIZE, false);

      expect(canvas.width).toBe(QR_SIZE * 2);
      expect(canvas.height).toBe(QR_SIZE * 2);
      expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    } finally {
      Object.defineProperty(window, "devicePixelRatio", { value: original, configurable: true });
    }
  });

  it("does nothing when the canvas has no 2d context", () => {
    const { canvas, ctx, getContext } = createFakeCanvas();
    getContext.mockReturnValue(null as never);

    drawStyledQrCode(canvas, "0xabc123", QR_SIZE, false);

    expect(ctx.arc).not.toHaveBeenCalled();
    expect(ctx.stroke).not.toHaveBeenCalled();
  });
});
