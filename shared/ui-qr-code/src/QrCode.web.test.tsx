import React from "react";
import { render, screen } from "@testing-library/react";
import qrcode from "qrcode";
import { QrCode } from "./QrCode.web";

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

const mockCreate = qrcode.create as jest.Mock;

describe("QrCode (web)", () => {
  beforeEach(() => {
    mockCreate.mockReset();
    // A minimal QR matrix; canvas drawing is skipped under jsdom (no 2d context).
    mockCreate.mockReturnValue({ modules: { size: 21, data: new Uint8Array(21 * 21) } });
  });

  it("should render the container and build the QR matrix from the value", () => {
    render(<QrCode value="0xabc123" testID="address-qr-code" />);

    expect(screen.getByTestId("address-qr-code")).toBeInTheDocument();
    expect(mockCreate).toHaveBeenCalledWith(
      "0xabc123",
      expect.objectContaining({ errorCorrectionLevel: "H" }),
    );
  });

  it("should render optional center content", () => {
    render(<QrCode value="0xabc123" centerContent={<span>icon</span>} />);

    expect(screen.getByText("icon")).toBeInTheDocument();
  });
});
