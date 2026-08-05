import React from "react";
import { render, screen, fireEvent } from "jest/render";
import { mockTransport, mockTransportPanelProps } from "jest/mocks/transport";
import { TransportDebug } from "./TransportDebug.native";

function makeRef() {
  return { current: null } as React.RefObject<unknown>;
}

describe("TransportDebug (native)", () => {
  it("renders the Transport Debug title", () => {
    render(<TransportDebug bottomSheetRef={makeRef()} transport={mockTransportPanelProps()} />);
    expect(screen.getByText("Transport Debug")).toBeOnTheScreen();
  });

  it("renders one row per history entry", () => {
    const config = mockTransportPanelProps({
      transport: mockTransport({
        history: [
          { id: "e1", seq: 1, ts: 0, origin: "local", kind: "ping", payload: null },
          { id: "e2", seq: 2, ts: 0, origin: "remote", kind: "pong", payload: null },
        ],
      }),
    });
    render(<TransportDebug bottomSheetRef={makeRef()} transport={config} />);
    expect(screen.getByText(/ping/)).toBeOnTheScreen();
    expect(screen.getByText(/pong/)).toBeOnTheScreen();
  });

  it("renders the Send button", () => {
    render(<TransportDebug bottomSheetRef={makeRef()} transport={mockTransportPanelProps()} />);
    expect(screen.getByText("Send")).toBeOnTheScreen();
  });

  it("defaults the Kind field to 'debug'", () => {
    render(<TransportDebug bottomSheetRef={makeRef()} transport={mockTransportPanelProps()} />);
    expect(screen.getByDisplayValue("debug")).toBeOnTheScreen();
  });

  it("shows the error message when transport.send throws", () => {
    const config = mockTransportPanelProps({
      transport: {
        ...mockTransport(),
        send: jest.fn().mockImplementation(() => {
          throw new Error("transport is not open");
        }),
      },
    });
    render(<TransportDebug bottomSheetRef={makeRef()} transport={config} />);
    fireEvent.press(screen.getByText("Send"));
    expect(screen.getByText("transport is not open")).toBeOnTheScreen();
  });

  it("clears the error on a successful send", () => {
    const send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("transport is not open");
      })
      .mockImplementationOnce(() => {});
    const config = mockTransportPanelProps({ transport: { ...mockTransport(), send } });
    render(<TransportDebug bottomSheetRef={makeRef()} transport={config} />);
    fireEvent.press(screen.getByText("Send"));
    expect(screen.getByText("transport is not open")).toBeOnTheScreen();
    fireEvent.press(screen.getByText("Send"));
    expect(screen.queryByText("transport is not open")).toBeNull();
  });

  it("calls transport.send with the current kind and message when Send is pressed", () => {
    const send = jest.fn();
    const config = mockTransportPanelProps({ transport: { ...mockTransport(), send } });
    render(<TransportDebug bottomSheetRef={makeRef()} transport={config} />);
    fireEvent.changeText(screen.getByDisplayValue("debug"), "action");
    fireEvent.changeText(screen.getByDisplayValue(""), '{"x":1}');
    fireEvent.press(screen.getByText("Send"));
    expect(send).toHaveBeenCalledWith("action", '{"x":1}');
  });
});
