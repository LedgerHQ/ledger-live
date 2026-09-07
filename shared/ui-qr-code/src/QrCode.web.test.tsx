import React from "react";
import { render, screen } from "@testing-library/react";
import { QrCode } from "./QrCode.web";

describe("QrCode (web)", () => {
  it("should render the container", () => {
    render(<QrCode value="0xabc123" testID="address-qr-code" />);

    expect(screen.getByTestId("address-qr-code")).toBeInTheDocument();
  });

  it("should render optional center content", () => {
    render(<QrCode value="0xabc123" centerContent={<span>icon</span>} />);

    expect(screen.getByText("icon")).toBeInTheDocument();
  });
});
