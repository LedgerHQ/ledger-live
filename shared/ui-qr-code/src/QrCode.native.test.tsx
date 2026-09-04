import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import qrcode from "qrcode";
import { QrCode } from "./QrCode.native";

jest.mock("qrcode", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

jest.mock("react-native-svg", () => {
  const React = require("react");
  const { View } = require("react-native");

  function createMockSvgElement(testID: string) {
    return function MockSvgElement({ children, ...props }: { children?: React.ReactNode }) {
      return React.createElement(View, { ...props, testID }, children);
    };
  }

  return {
    __esModule: true,
    default: createMockSvgElement("styled-qr-code"),
    Circle: createMockSvgElement("styled-qr-code-dot"),
    Rect: createMockSvgElement("styled-qr-code-finder"),
  };
});

describe("QrCode", () => {
  const mockCreate = qrcode.create as jest.Mock;

  beforeEach(() => {
    mockCreate.mockReset();
    mockCreate.mockReturnValue({
      modules: { size: 21, data: new Uint8Array(21 * 21).fill(1) },
    });
  });

  it("should render a rounded QR code with high error correction", () => {
    const { getByTestId } = render(<QrCode value="0xabc123" testID="address-qr-code" />);

    expect(getByTestId("address-qr-code")).toBeTruthy();
    expect(getByTestId("styled-qr-code")).toHaveProp("width", 200);
    expect(mockCreate).toHaveBeenCalledWith("0xabc123", {
      errorCorrectionLevel: "H",
    });
  });

  it("should render optional center content over a clear QR area", () => {
    const { getByText, queryAllByTestId } = render(
      <QrCode value="0xabc123" centerContent={<Text>icon</Text>} />,
    );

    expect(getByText("icon")).toBeTruthy();
    expect(queryAllByTestId("styled-qr-code-dot")).toHaveLength(245);
    expect(queryAllByTestId("styled-qr-code-finder")).toHaveLength(6);
  });

  it("should use the supplied foreground color", () => {
    const { getAllByTestId } = render(<QrCode value="0xabc123" foregroundColor="#000000" />);

    expect(getAllByTestId("styled-qr-code-dot")[0]).toHaveProp("fill", "#000000");
    expect(getAllByTestId("styled-qr-code-finder")[0]).toHaveProp("stroke", "#000000");
  });

});
