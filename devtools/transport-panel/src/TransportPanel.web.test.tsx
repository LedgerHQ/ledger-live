import { render, screen, fireEvent } from "jest/render";
import { mockTransportPanelProps } from "jest/mocks/transport";
import { TransportPanel } from "./TransportPanel.web";

describe("TransportPanel", () => {
  it("renders the current connection status from transport state", () => {
    render(<TransportPanel {...mockTransportPanelProps()} />);
    expect(screen.getByText("open")).toBeInTheDocument();
  });

  it("renders the role badge", () => {
    render(<TransportPanel {...mockTransportPanelProps({ role: "tool" })} />);
    expect(screen.getByText("tool")).toBeInTheDocument();
  });

  it("starts collapsed — panel content is not visible", () => {
    render(<TransportPanel {...mockTransportPanelProps()} />);
    expect(screen.queryByText("Hub URL")).not.toBeInTheDocument();
  });

  it("expands panel content when the header button is clicked", () => {
    render(<TransportPanel {...mockTransportPanelProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /WS/i }));
    expect(screen.getByText("Hub URL")).toBeInTheDocument();
  });

  it("collapses panel content when the header button is clicked a second time", () => {
    render(<TransportPanel {...mockTransportPanelProps()} />);
    fireEvent.click(screen.getByRole("button", { name: /WS/i }));
    fireEvent.click(screen.getByRole("button", { name: /WS/i }));
    expect(screen.queryByText("Hub URL")).not.toBeInTheDocument();
  });
});
