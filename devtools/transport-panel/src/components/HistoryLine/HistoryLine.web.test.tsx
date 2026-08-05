import { render, screen, fireEvent } from "jest/render";
import type { Envelope, MessageMap } from "@devtools/transport";
import { HistoryLine } from "./HistoryLine.web";

const makeEnvelope = (overrides?: Partial<Envelope<MessageMap>>): Envelope<MessageMap> => ({
  id: "abc-123",
  seq: 1,
  ts: 1000,
  origin: "remote",
  kind: "action",
  payload: { foo: "bar" },
  ...overrides,
});

describe("HistoryLine", () => {
  it("starts collapsed and shows the one-liner summary", () => {
    render(<HistoryLine envelope={makeEnvelope()} localOrigin="local" />);
    expect(screen.getByText(/^#1 action/)).toBeInTheDocument();
    expect(screen.queryByText(/"id":/)).not.toBeInTheDocument();
  });

  it("expands to show the full envelope JSON when clicked", () => {
    render(<HistoryLine envelope={makeEnvelope()} localOrigin="local" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/"id":/)).toBeInTheDocument();
    expect(screen.getByText(/"seq":/)).toBeInTheDocument();
    expect(screen.getByText(/"kind":/)).toBeInTheDocument();
  });

  it("collapses back to the one-liner when clicked a second time", () => {
    render(<HistoryLine envelope={makeEnvelope()} localOrigin="local" />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(screen.queryByText(/"id":/)).not.toBeInTheDocument();
    expect(screen.getByText(/^#1 action/)).toBeInTheDocument();
  });

  it("truncates the collapsed summary with '…' when the line exceeds 50 chars", () => {
    const envelope = makeEnvelope({ payload: "x".repeat(200) });
    render(<HistoryLine envelope={envelope} localOrigin="local" />);
    const button = screen.getByRole("button");
    expect(button.textContent).toContain("…");
  });

  it("shows the 'Output too big to display' sentinel when the payload JSON exceeds 500 chars in expanded view", () => {
    const envelope = makeEnvelope({ payload: "x".repeat(600) });
    render(<HistoryLine envelope={envelope} localOrigin="local" />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByText(/"Output too big to display"/)).toBeInTheDocument();
  });

  it("uses the accent colour on the arrow when the envelope was sent by the local origin", () => {
    const envelope = makeEnvelope({ origin: "local" });
    const { container } = render(<HistoryLine envelope={envelope} localOrigin="local" />);
    expect(container.querySelector("svg")).toHaveClass("text-accent");
  });

  it("uses the muted colour on the arrow when the envelope was received from a remote origin", () => {
    const envelope = makeEnvelope({ origin: "remote" });
    const { container } = render(<HistoryLine envelope={envelope} localOrigin="local" />);
    expect(container.querySelector("svg")).toHaveClass("text-muted");
  });
});
