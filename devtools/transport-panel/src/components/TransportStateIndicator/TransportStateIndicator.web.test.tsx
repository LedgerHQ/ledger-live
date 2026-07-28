import { render, screen } from "jest/render";
import type { TransportState, ConnectionStatus } from "@devtools/transport";
import { TransportStateIndicator } from "./TransportStateIndicator";

const makeState = (status: ConnectionStatus): TransportState<any> => ({
  status,
  url: "ws://localhost",
  origin: "test",
  history: [],
});

describe("TransportStateIndicator", () => {
  it.each<ConnectionStatus>(["idle", "connecting", "open", "closed", "error"])(
    'displays "%s" status text',
    status => {
      render(<TransportStateIndicator transportState={makeState(status)} />);
      expect(screen.getByText(status)).toBeVisible();
    },
  );
});
