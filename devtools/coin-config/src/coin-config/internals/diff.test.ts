import { MAX_DIFF_CELLS, diffJsonLines } from "./diff";

describe("diffJsonLines", () => {
  it("should keep common lines and tag the changed ones", () => {
    const base = '{\n  "enabled": false,\n  "tokens": []\n}';
    const current = '{\n  "enabled": true,\n  "tokens": []\n}';

    expect(diffJsonLines(base, current)).toEqual([
      { state: "none", text: "{" },
      { state: "removed", text: '  "enabled": false,' },
      { state: "added", text: '  "enabled": true,' },
      { state: "none", text: '  "tokens": []' },
      { state: "none", text: "}" },
    ]);
  });

  it("should list both sides without aligning them past the size limit", () => {
    const lineCount = Math.ceil(Math.sqrt(MAX_DIFF_CELLS)) + 1;
    const base = Array.from({ length: lineCount }, (_, i) => `a${i}`).join("\n");
    const current = Array.from({ length: lineCount }, (_, i) => `b${i}`).join("\n");

    const diff = diffJsonLines(base, current);

    expect(diff).toHaveLength(lineCount * 2);
    expect(diff[0]).toEqual({ state: "removed", text: "a0" });
    expect(diff[lineCount]).toEqual({ state: "added", text: "b0" });
  });
});
