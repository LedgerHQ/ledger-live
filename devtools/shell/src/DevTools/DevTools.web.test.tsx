import { render, screen } from "jest/render";
import { DevTools } from "./DevTools.web";

jest.mock("../registry/useResolvedTools", () => ({
  useResolvedTools: () => ({ tools: [], failures: [] }),
}));

beforeEach(() => {
  localStorage.clear();
});

describe("DevTools (web)", () => {
  it("renders the shell with nav and content area", () => {
    render(<DevTools toolLoaders={{}} />);
    expect(screen.getByTestId("devtools")).toBeInTheDocument();
    expect(screen.getByTestId("devtools-nav")).toBeInTheDocument();
  });

  it("shows empty state when no tool is selected", () => {
    render(<DevTools toolLoaders={{}} />);
    expect(screen.getByTestId("devtools-empty")).toBeInTheDocument();
  });

  it("shows the internal tools warning strip", () => {
    render(<DevTools toolLoaders={{}} />);
    expect(screen.getByText(/Internal tools/)).toBeInTheDocument();
  });
});
