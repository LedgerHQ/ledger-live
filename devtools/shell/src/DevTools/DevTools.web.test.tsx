import { render, screen } from "jest/render";
import { DevTools } from "./DevTools.web";

beforeEach(() => {
  localStorage.clear();
});

describe("DevTools (web)", () => {
  it("renders the shell with nav and content area", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools")).toBeInTheDocument();
    expect(screen.getByTestId("devtools-nav")).toBeInTheDocument();
  });

  it("shows empty state when no tool is selected", () => {
    render(<DevTools />);
    expect(screen.getByTestId("devtools-empty")).toBeInTheDocument();
  });

  it("shows the internal tools warning strip", () => {
    render(<DevTools />);
    expect(screen.getByText(/Internal tools/)).toBeInTheDocument();
  });
});
