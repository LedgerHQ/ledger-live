import { render, screen } from "jest/render";
import type { ConnectionStatus, TransportState, MessageMap } from "@devtools/transport";
import { TransportStateIndicator } from "./TransportStateIndicator";

const makeState = (status: ConnectionStatus): TransportState<MessageMap> => ({
  status,
  url: "ws://localhost",
  origin: "test",
  history: [],
});

describe("TransportStateIndicator (native)", () => {
  it.each<ConnectionStatus>(["idle", "connecting", "open", "closed", "error"])(
    'displays "%s" status text',
    status => {
      render(<TransportStateIndicator transportState={makeState(status)} role="host" />);
      expect(screen.getByText(status)).toBeOnTheScreen();
    },
  );

  it("displays the role text", () => {
    render(<TransportStateIndicator transportState={makeState("open")} role="tool" />);
    expect(screen.getByText("tool")).toBeOnTheScreen();
  });

  it("displays the WS label", () => {
    render(<TransportStateIndicator transportState={makeState("open")} role="host" />);
    expect(screen.getByText("WS")).toBeOnTheScreen();
  });
});
