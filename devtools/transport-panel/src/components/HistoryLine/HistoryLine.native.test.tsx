import { render, screen, fireEvent } from "jest/render";
import type { Envelope, MessageMap } from "@devtools/transport";
import { HistoryLine } from "./HistoryLine.native";

const makeEnvelope = (overrides?: Partial<Envelope<MessageMap>>): Envelope<MessageMap> => ({
  id: "abc-123",
  seq: 1,
  ts: 1000,
  origin: "remote",
  kind: "action",
  payload: { foo: "bar" },
  ...overrides,
});

describe("HistoryLine (native)", () => {
  it("shows the down arrow for a received envelope", () => {
    render(<HistoryLine envelope={makeEnvelope({ origin: "remote" })} localOrigin="local" />);
    expect(screen.getByText("↓")).toBeOnTheScreen();
  });

  it("shows the up arrow for a sent envelope", () => {
    render(<HistoryLine envelope={makeEnvelope({ origin: "local" })} localOrigin="local" />);
    expect(screen.getByText("↑")).toBeOnTheScreen();
  });

  it("starts collapsed and shows the one-liner summary", () => {
    render(<HistoryLine envelope={makeEnvelope()} localOrigin="local" />);
    expect(screen.getByText(/^#1 action/)).toBeOnTheScreen();
  });

  it("expands to show the full envelope JSON when pressed", () => {
    render(<HistoryLine envelope={makeEnvelope()} localOrigin="local" />);
    fireEvent.press(screen.getByRole("button"));
    expect(screen.getByText(/"id":/)).toBeOnTheScreen();
  });

  it("collapses back to the one-liner when pressed a second time", () => {
    render(<HistoryLine envelope={makeEnvelope()} localOrigin="local" />);
    const button = screen.getByRole("button");
    fireEvent.press(button);
    fireEvent.press(button);
    expect(screen.getByText(/^#1 action/)).toBeOnTheScreen();
    expect(screen.queryByText(/"id":/)).toBeNull();
  });

  it("truncates the collapsed summary with '…' when the line exceeds 50 chars", () => {
    const envelope = makeEnvelope({ payload: "x".repeat(200) });
    render(<HistoryLine envelope={envelope} localOrigin="local" />);
    expect(screen.getByText(/…/)).toBeOnTheScreen();
  });

  it("shows the 'Output too big to display' sentinel when expanded with a large payload", () => {
    const envelope = makeEnvelope({ payload: "x".repeat(600) });
    render(<HistoryLine envelope={envelope} localOrigin="local" />);
    fireEvent.press(screen.getByRole("button"));
    expect(screen.getByText(/"Output too big to display"/)).toBeOnTheScreen();
  });
});
