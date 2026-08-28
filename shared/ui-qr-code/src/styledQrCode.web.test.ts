import qrcode from "qrcode";
import { createStyledQrCode } from "./styledQrCode";

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

describe("createStyledQrCode", () => {
  const mockCreate = qrcode.create as jest.Mock;

  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockReturnValue({
      modules: { size: 21, data: new Uint8Array(21 * 21).fill(1) },
    });
  });

  it("should use the complete QR surface for finder patterns", () => {
    const size = 200;
    const moduleSize = size / 21;

    const { finders } = createStyledQrCode("0xabc123", size, true);

    expect(finders).toEqual([
      { x: 0, y: 0, moduleSize },
      { x: 14 * moduleSize, y: 0, moduleSize },
      { x: 0, y: 14 * moduleSize, moduleSize },
    ]);
  });
});
