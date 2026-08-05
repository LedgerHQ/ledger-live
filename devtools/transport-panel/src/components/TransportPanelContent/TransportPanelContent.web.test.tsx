import { render, screen, fireEvent } from "jest/render";
import { mockTransportPanelProps, mockTransport } from "jest/mocks/transport";
import { TransportPanelContent } from "./TransportPanelContent.web";

describe("TransportPanelContent", () => {
  it("always renders the Hub URL field", () => {
    render(<TransportPanelContent transportConfig={mockTransportPanelProps()} />);
    expect(screen.getByText("Hub URL")).toBeInTheDocument();
  });

  it("renders the Target field when role is 'tool'", () => {
    render(<TransportPanelContent transportConfig={mockTransportPanelProps({ role: "tool" })} />);
    expect(screen.getByText("Target")).toBeInTheDocument();
  });

  it("hides the Target field when role is 'host'", () => {
    render(<TransportPanelContent transportConfig={mockTransportPanelProps({ role: "host" })} />);
    expect(screen.queryByText("Target")).not.toBeInTheDocument();
  });

  it("calls transport.setUrl with the current URL when Refresh is clicked", () => {
    const setUrl = jest.fn();
    const config = mockTransportPanelProps({
      transport: { ...mockTransport({ url: "ws://localhost:8080" }), setUrl },
    });
    render(<TransportPanelContent transportConfig={config} />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(setUrl).toHaveBeenCalledWith("ws://localhost:8080");
  });

  it("opens the debug dialog when Repair is clicked", () => {
    render(<TransportPanelContent transportConfig={mockTransportPanelProps()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Repair" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
