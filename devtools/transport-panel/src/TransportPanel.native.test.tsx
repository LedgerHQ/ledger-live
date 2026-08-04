import { render, screen } from "jest/render";
import { mockTransportPanelProps, mockTransport } from "jest/mocks/transport";
import { TransportPanel } from "./TransportPanel";

describe("TransportPanel (native)", () => {
  it("renders the current connection status", () => {
    render(<TransportPanel {...mockTransportPanelProps()} />);
    expect(screen.getAllByText("open")[0]).toBeOnTheScreen();
  });

  it("renders the state indicator", () => {
    render(<TransportPanel {...mockTransportPanelProps()} />);
    expect(screen.getAllByTestId("transport-state-indicator")[0]).toBeOnTheScreen();
  });

  it("reflects updated status from transport state", () => {
    render(
      <TransportPanel
        {...mockTransportPanelProps({ transport: mockTransport({ status: "connecting" }) })}
      />,
    );
    expect(screen.getAllByText("connecting")[0]).toBeOnTheScreen();
  });
});
