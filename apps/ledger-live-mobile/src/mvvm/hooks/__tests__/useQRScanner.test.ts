import { renderHook } from "@tests/test-renderer";
import { useQRScanner } from "../useQRScanner";
import { Code } from "react-native-vision-camera";

describe("useQRScanner", () => {
  it("should return device and codeScanner", () => {
    const onScan = jest.fn();
    const { result } = renderHook(() => useQRScanner(onScan));

    expect(result.current.device).toEqual({
      id: "mock-camera-device",
      position: "back",
    });
    expect(result.current.codeScanner).toBeDefined();
    expect(result.current.codeScanner.codeTypes).toEqual(["qr"]);
  });

  it("should call onScan when a QR code is scanned", () => {
    const onScan = jest.fn();
    const { result } = renderHook(() => useQRScanner(onScan));

    const mockCode: Code[] = [{ value: "test-qr-data", type: "qr" }];
    result.current.codeScanner.onCodeScanned(mockCode, { width: 100, height: 100 });

    expect(onScan).toHaveBeenCalledWith("test-qr-data");
  });

  it("should not call onScan when code has no value", () => {
    const onScan = jest.fn();
    const { result } = renderHook(() => useQRScanner(onScan));

    const mockCode: Code[] = [{ value: "", type: "qr" }];
    result.current.codeScanner.onCodeScanned(mockCode, { width: 100, height: 100 });

    expect(onScan).not.toHaveBeenCalled();
  });

  it("should not call onScan when codes array is empty", () => {
    const onScan = jest.fn();
    const { result } = renderHook(() => useQRScanner(onScan));

    result.current.codeScanner.onCodeScanned([], { width: 100, height: 100 });

    expect(onScan).not.toHaveBeenCalled();
  });
});
