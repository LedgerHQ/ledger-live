import React from "react";
import { render, screen, fireEvent } from "jest/render";
import { mockTransport, mockTransportPanelProps } from "jest/mocks/transport";
import { TransportPanelContent } from "./TransportPanelContent";

function makeRef() {
  return { current: null } as React.RefObject<unknown>;
}

describe("TransportPanelContent (native)", () => {
  it("renders the Transport State title", () => {
    render(
      <TransportPanelContent bottomSheetRef={makeRef()} transport={mockTransportPanelProps()} />,
    );
    expect(screen.getByText("Transport State")).toBeOnTheScreen();
  });

  it("renders the connection status from the transport state", () => {
    render(
      <TransportPanelContent bottomSheetRef={makeRef()} transport={mockTransportPanelProps()} />,
    );
    expect(screen.getByText("open")).toBeOnTheScreen();
  });

  it("always renders the Hub URL field", () => {
    render(
      <TransportPanelContent
        bottomSheetRef={makeRef()}
        transport={mockTransportPanelProps({ hubUrl: "ws://hub:8080" })}
      />,
    );
    expect(screen.getByDisplayValue("ws://hub:8080")).toBeOnTheScreen();
  });

  it("renders the Target field when setTarget and target are provided", () => {
    const config = mockTransportPanelProps({ target: "ws://target", setTarget: jest.fn() });
    render(<TransportPanelContent bottomSheetRef={makeRef()} transport={config} />);
    expect(screen.getByDisplayValue("ws://target")).toBeOnTheScreen();
  });

  it("hides the Target field when setTarget is not provided", () => {
    const config = mockTransportPanelProps({ target: undefined, setTarget: undefined });
    render(<TransportPanelContent bottomSheetRef={makeRef()} transport={config} />);
    expect(screen.queryByDisplayValue("ws://target")).toBeNull();
  });

  it("calls transport.setUrl with the current URL when Refresh is pressed", () => {
    const setUrl = jest.fn();
    const config = mockTransportPanelProps({
      transport: { ...mockTransport({ url: "ws://localhost:8080" }), setUrl },
    });
    render(<TransportPanelContent bottomSheetRef={makeRef()} transport={config} />);
    fireEvent.press(screen.getByRole("button", { name: "Refresh" }));
    expect(setUrl).toHaveBeenCalledWith("ws://localhost:8080");
  });

  it("renders the Debug websocket button", () => {
    render(
      <TransportPanelContent bottomSheetRef={makeRef()} transport={mockTransportPanelProps()} />,
    );
    expect(screen.getByRole("button", { name: "Debug websocket" })).toBeOnTheScreen();
  });
});
