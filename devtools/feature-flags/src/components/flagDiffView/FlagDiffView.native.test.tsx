import { render, screen } from "jest/render.native";
import type { DiffLine } from "../../utils";
import { FlagDiffView } from "./FlagDiffView";

const exactText = (value: string) =>
  screen.getByText(value, { exact: true, normalizer: text => text });

describe("FlagDiffView (native)", () => {
  it("renders one row per diff line", () => {
    const diff: DiffLine[] = [
      { state: "none", text: "alpha" },
      { state: "added", text: "beta" },
      { state: "none", text: "gamma" },
    ];
    render(<FlagDiffView diff={diff} />);
    expect(screen.getAllByText(/alpha|beta|gamma/)).toHaveLength(3);
  });

  it("renders nothing for an empty diff", () => {
    render(<FlagDiffView diff={[]} />);
    expect(screen.queryByText(/.+/)).toBeNull();
  });

  it("prefixes added lines with '+'", () => {
    render(<FlagDiffView diff={[{ state: "added", text: "enabled: true" }]} />);
    expect(exactText("+ enabled: true")).toBeOnTheScreen();
  });

  it("prefixes removed lines with '-'", () => {
    render(<FlagDiffView diff={[{ state: "removed", text: "enabled: false" }]} />);
    expect(exactText("- enabled: false")).toBeOnTheScreen();
  });

  it("prefixes unchanged lines with a space", () => {
    render(<FlagDiffView diff={[{ state: "none", text: "{" }]} />);
    expect(exactText("  {")).toBeOnTheScreen();
  });
});
