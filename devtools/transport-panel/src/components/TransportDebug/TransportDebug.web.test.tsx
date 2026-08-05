import { render, screen, fireEvent } from "jest/render";
import { mockTransportPanelProps, mockTransport } from "jest/mocks/transport";
import { TransportDebug } from "./TransportDebug.web";

describe("TransportDebug", () => {
  it("renders the dialog when open", () => {
    render(<TransportDebug transportConfig={mockTransportPanelProps()} open />);
    expect(screen.getByRole("dialog", { name: "Transport Debug" })).toBeInTheDocument();
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
    render(<TransportDebug transportConfig={config} open />);
    expect(screen.getByText(/ping/)).toBeInTheDocument();
    expect(screen.getByText(/pong/)).toBeInTheDocument();
  });

  it("always renders the Send button", () => {
    render(<TransportDebug transportConfig={mockTransportPanelProps()} open />);
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("defaults the Kind field to 'debug'", () => {
    render(<TransportDebug transportConfig={mockTransportPanelProps()} open />);
    expect(screen.getByDisplayValue("debug")).toBeInTheDocument();
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
    render(<TransportDebug transportConfig={config} open />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("transport is not open")).toBeInTheDocument();
  });

  it("clears the error message on a successful send", () => {
    const send = jest
      .fn()
      .mockImplementationOnce(() => {
        throw new Error("transport is not open");
      })
      .mockImplementationOnce(() => {});
    const config = mockTransportPanelProps({ transport: { ...mockTransport(), send } });
    render(<TransportDebug transportConfig={config} open />);
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.getByText("transport is not open")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(screen.queryByText("transport is not open")).not.toBeInTheDocument();
  });

  it("calls transport.send with the current kind and message when Send is clicked", () => {
    const send = jest.fn();
    const config = mockTransportPanelProps({
      transport: { ...mockTransport(), send },
    });
    render(<TransportDebug transportConfig={config} open />);

    const [kindInput, messageInput] = screen.getAllByRole("textbox");
    fireEvent.change(kindInput, { target: { value: "action" } });
    fireEvent.change(messageInput, { target: { value: '{"x":1}' } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(send).toHaveBeenCalledWith("action", '{"x":1}');
  });
});
