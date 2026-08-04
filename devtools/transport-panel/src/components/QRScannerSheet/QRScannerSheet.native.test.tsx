import React from "react";
import { render, screen, act } from "jest/render";
import { QRScannerSheet } from "./QRScannerSheet.native";

jest.mock("react-native-vision-camera", () => ({
  Camera: "Camera",
  useCameraPermission: jest.fn(),
  useCameraDevice: jest.fn(),
  useCodeScanner: jest.fn().mockReturnValue({}),
}));

const rnvc = jest.requireMock("react-native-vision-camera");

function makeRef() {
  return { current: null } as React.RefObject<any>;
}

describe("QRScannerSheet (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    rnvc.useCameraPermission.mockReturnValue({ hasPermission: false });
    rnvc.useCameraDevice.mockReturnValue(null);
    rnvc.useCodeScanner.mockReturnValue({});
  });

  it("renders the 'Scan relay QR' header", () => {
    render(<QRScannerSheet bottomSheetRef={makeRef()} onScan={jest.fn()} />);
    expect(screen.getByText("Scan relay QR")).toBeOnTheScreen();
  });

  it("shows 'Camera permission required' when permission is not granted", () => {
    render(<QRScannerSheet bottomSheetRef={makeRef()} onScan={jest.fn()} />);
    expect(screen.getByText("Camera permission required")).toBeOnTheScreen();
  });

  it("shows 'Camera permission required' when no back camera device is available", () => {
    rnvc.useCameraPermission.mockReturnValue({ hasPermission: true });
    render(<QRScannerSheet bottomSheetRef={makeRef()} onScan={jest.fn()} />);
    expect(screen.getByText("Camera permission required")).toBeOnTheScreen();
  });

  it("hides the fallback text when permission is granted and a device is available", () => {
    rnvc.useCameraPermission.mockReturnValue({ hasPermission: true });
    rnvc.useCameraDevice.mockReturnValue({ id: "back" });
    render(<QRScannerSheet bottomSheetRef={makeRef()} onScan={jest.fn()} />);
    expect(screen.queryByText("Camera permission required")).toBeNull();
  });

  it("calls onScan with the scanned value when a QR code is detected", () => {
    rnvc.useCameraPermission.mockReturnValue({ hasPermission: true });
    rnvc.useCameraDevice.mockReturnValue({ id: "back" });
    const onScan = jest.fn();
    render(<QRScannerSheet bottomSheetRef={makeRef()} onScan={onScan} />);
    const { onCodeScanned } = rnvc.useCodeScanner.mock.calls[0][0];
    act(() => onCodeScanned([{ value: "ws://relay:9090?token=abc" }]));
    expect(onScan).toHaveBeenCalledWith("ws://relay:9090?token=abc");
  });

  it("dismisses the bottom sheet after a successful scan", () => {
    rnvc.useCameraPermission.mockReturnValue({ hasPermission: true });
    rnvc.useCameraDevice.mockReturnValue({ id: "back" });
    const ref = makeRef();
    render(<QRScannerSheet bottomSheetRef={ref} onScan={jest.fn()} />);
    const dismissSpy = jest.spyOn(ref.current, "dismiss");
    const { onCodeScanned } = rnvc.useCodeScanner.mock.calls[0][0];
    act(() => onCodeScanned([{ value: "ws://relay:9090?token=abc" }]));
    expect(dismissSpy).toHaveBeenCalledTimes(1);
  });

  it("ignores empty code lists without calling onScan or dismiss", () => {
    rnvc.useCameraPermission.mockReturnValue({ hasPermission: true });
    rnvc.useCameraDevice.mockReturnValue({ id: "back" });
    const onScan = jest.fn();
    const ref = makeRef();
    render(<QRScannerSheet bottomSheetRef={ref} onScan={onScan} />);
    const dismissSpy = jest.spyOn(ref.current, "dismiss");
    const { onCodeScanned } = rnvc.useCodeScanner.mock.calls[0][0];
    act(() => onCodeScanned([]));
    expect(onScan).not.toHaveBeenCalled();
    expect(dismissSpy).not.toHaveBeenCalled();
  });

  it("ignores scan results with an undefined value", () => {
    rnvc.useCameraPermission.mockReturnValue({ hasPermission: true });
    rnvc.useCameraDevice.mockReturnValue({ id: "back" });
    const onScan = jest.fn();
    render(<QRScannerSheet bottomSheetRef={makeRef()} onScan={onScan} />);
    const { onCodeScanned } = rnvc.useCodeScanner.mock.calls[0][0];
    act(() => onCodeScanned([{ value: undefined }]));
    expect(onScan).not.toHaveBeenCalled();
  });
});
