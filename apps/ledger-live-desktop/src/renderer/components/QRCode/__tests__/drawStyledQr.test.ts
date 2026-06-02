import qrcode from "qrcode";
import { drawStyledQr } from "../drawStyledQr";

/**
 * Build a Canvas2D-shaped mock that records every paint operation so
 * we can assert against them. The real `HTMLCanvasElement` isn't
 * available in jsdom without a polyfill, and we don't need pixel-level
 * fidelity here — only that the helper emits the right *number* of
 * shapes in the right *places* given a known matrix.
 */
function createCanvasMock(buffer = 200) {
  const calls: Array<{ op: string; args: unknown[] }> = [];
  const ctx = {
    beginPath: jest.fn(() => calls.push({ op: "beginPath", args: [] })),
    roundRect: jest.fn((...args: unknown[]) => calls.push({ op: "roundRect", args })),
    fill: jest.fn((...args: unknown[]) => calls.push({ op: "fill", args })),
    fillRect: jest.fn((...args: unknown[]) => calls.push({ op: "fillRect", args })),
    clearRect: jest.fn((...args: unknown[]) => calls.push({ op: "clearRect", args })),
    fillStyle: "",
  };
  const canvas = {
    width: buffer,
    height: buffer,
    getContext: () => ctx,
  } as unknown as HTMLCanvasElement;
  return { canvas, ctx, calls };
}

describe("drawStyledQr", () => {
  it("clears the canvas, paints data modules, and stylises the three finder patterns", () => {
    const qr = qrcode.create("hello world", { errorCorrectionLevel: "H" });
    const { canvas, ctx, calls } = createCanvasMock(294); // 7 cells × 42px each for v=4 (33 modules)

    drawStyledQr(canvas, qr);

    // Always clears the buffer.
    expect(ctx.clearRect).toHaveBeenCalledTimes(1);

    // Each of the three finder patterns produces exactly two
    // `fill(...)` calls: one with the even-odd rule for the hollow
    // frame, then one for the centre block. The data loop also fills
    // once per dark module, so we just assert the finder pattern
    // emitted its specific 3 × `fill("evenodd")`.
    const evenoddFills = calls.filter(
      c => c.op === "fill" && c.args[0] === "evenodd",
    );
    expect(evenoddFills).toHaveLength(3);
  });

  it("renders ONE rounded rect per dark data module (and skips the finder patterns)", () => {
    const qr = qrcode.create("test", { errorCorrectionLevel: "H" });
    const { canvas, ctx } = createCanvasMock(300);

    drawStyledQr(canvas, qr);

    const { size, data } = qr.modules;
    // Count true cells outside the three 7×7 finder patterns.
    const lastFinder = size - 7;
    let dataModuleCount = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!data[r * size + c]) continue;
        const inFinder =
          (r < 7 && c < 7) ||
          (r < 7 && c >= lastFinder) ||
          (r >= lastFinder && c < 7);
        if (!inFinder) dataModuleCount++;
      }
    }

    // Three finder patterns each call `roundRect` 3 times (outer
    // frame, inner cutout, centre block) → 9 finder roundRects total.
    // Everything else is one roundRect per data module.
    const totalRoundRects = (ctx.roundRect as jest.Mock).mock.calls.length;
    expect(totalRoundRects).toBe(dataModuleCount + 9);
  });

  it("uses the supplied colours", () => {
    const qr = qrcode.create("color check", { errorCorrectionLevel: "H" });
    const { canvas, ctx } = createCanvasMock();

    drawStyledQr(canvas, qr, { darkColor: "#ff00aa", lightColor: "#fafafa" });

    // The light fill (background) is applied first, then the dark
    // fillStyle takes over for module rendering. We can only inspect
    // the final value — which must be the dark colour.
    expect(ctx.fillStyle).toBe("#ff00aa");
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 200, 200);
  });

  it("skips the background fill when lightColor is transparent (default)", () => {
    const qr = qrcode.create("default bg", { errorCorrectionLevel: "H" });
    const { canvas, ctx } = createCanvasMock();

    drawStyledQr(canvas, qr);

    expect(ctx.fillRect).not.toHaveBeenCalled();
  });

  it("no-ops gracefully when getContext returns null (jsdom edge case)", () => {
    const canvas = {
      width: 200,
      height: 200,
      getContext: () => null,
    } as unknown as HTMLCanvasElement;
    const qr = qrcode.create("safe", { errorCorrectionLevel: "H" });

    expect(() => drawStyledQr(canvas, qr)).not.toThrow();
  });
});
