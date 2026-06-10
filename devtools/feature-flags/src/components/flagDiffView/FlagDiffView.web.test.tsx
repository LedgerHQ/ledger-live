import { render } from "@testing-library/react";
import type { DiffLine } from "../../utils";
import { FlagDiffView } from "./FlagDiffView.web";

const lines = (container: HTMLElement) => Array.from(container.querySelectorAll("pre > div"));

describe("FlagDiffView", () => {
  it("renders one row per diff line", () => {
    const diff: DiffLine[] = [
      { state: "none", text: "{" },
      { state: "added", text: '  "enabled": true' },
      { state: "none", text: "}" },
    ];
    const { container } = render(<FlagDiffView diff={diff} />);
    expect(lines(container)).toHaveLength(3);
  });

  it("renders nothing for an empty diff", () => {
    const { container } = render(<FlagDiffView diff={[]} />);
    expect(lines(container)).toHaveLength(0);
  });

  it("prefixes added lines with '+' and styles them as success", () => {
    const diff: DiffLine[] = [{ state: "added", text: '  "enabled": true' }];
    const { container } = render(<FlagDiffView diff={diff} />);
    const [row] = lines(container);
    expect(row.textContent).toBe('+   "enabled": true');
    expect(row).toHaveClass("text-success");
  });

  it("prefixes removed lines with '-' and styles them as error", () => {
    const diff: DiffLine[] = [{ state: "removed", text: '  "enabled": false' }];
    const { container } = render(<FlagDiffView diff={diff} />);
    const [row] = lines(container);
    expect(row.textContent).toBe('-   "enabled": false');
    expect(row).toHaveClass("text-error");
  });

  it("prefixes unchanged lines with a space and styles them as muted", () => {
    const diff: DiffLine[] = [{ state: "none", text: "{" }];
    const { container } = render(<FlagDiffView diff={diff} />);
    const [row] = lines(container);
    expect(row.textContent).toBe("  {");
    expect(row).toHaveClass("text-muted");
  });

  it("preserves the order of the lines", () => {
    const diff: DiffLine[] = [
      { state: "removed", text: "a" },
      { state: "added", text: "b" },
      { state: "none", text: "c" },
    ];
    const { container } = render(<FlagDiffView diff={diff} />);
    expect(lines(container).map(row => row.textContent)).toEqual(["- a", "+ b", "  c"]);
  });
});
