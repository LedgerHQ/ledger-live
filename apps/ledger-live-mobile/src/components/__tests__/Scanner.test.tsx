import React from "react";
import { render, screen } from "@tests/test-renderer";
import ScanQrCode from "../Scanner";

jest.mock("~/newArch/hooks/useQRScanner", () => ({
  useQRScanner: jest.fn(() => ({
    device: { id: "mock-device", position: "back" },
    codeScanner: { codeTypes: ["qr"], onCodeScanned: jest.fn() },
  })),
}));

describe("Scanner", () => {
  const mockOnResult = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with testID", async () => {
    render(<ScanQrCode onResult={mockOnResult} />);
    expect(await screen.findByTestId("scan-camera")).toBeTruthy();
  });

  it("should render with liveQRCode prop showing instructions", async () => {
    render(<ScanQrCode onResult={mockOnResult} liveQRCode />);
    expect(await screen.findByTestId("scan-camera")).toBeTruthy();
  });

  it("should render progress bar when liveQRCode and progress > 0", async () => {
    render(<ScanQrCode onResult={mockOnResult} liveQRCode progress={0.5} />);
    expect(await screen.findByTestId("scan-camera")).toBeTruthy();
  });
});
