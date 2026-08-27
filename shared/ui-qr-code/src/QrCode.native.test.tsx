import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { QrCode } from "./QrCode.native";

jest.mock("react-native-qrcode-svg", () => {
  const React = require("react");
  const { Text: RNText } = require("react-native");

  return function MockQRCode({ value }: { value: string }) {
    return React.createElement(RNText, { testID: "mock-qr-code-value" }, value);
  };
});

describe("QrCode", () => {
  it("should render the encoded address value", () => {
    const { getByTestId } = render(<QrCode value="0xabc123" testID="address-qr-code" />);

    expect(getByTestId("address-qr-code")).toBeTruthy();
    expect(getByTestId("mock-qr-code-value")).toHaveTextContent("0xabc123");
  });

  it("should render optional center content", () => {
    const { getByText } = render(<QrCode value="0xabc123" centerContent={<Text>icon</Text>} />);

    expect(getByText("icon")).toBeTruthy();
  });
});
