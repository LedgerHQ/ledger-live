import { canonicalJson, diffJsonLines } from "./diff";
import type { DiffLine } from "./diff";

const texts = (lines: DiffLine[]) => lines.map(l => l.text);
const states = (lines: DiffLine[]) => lines.map(l => l.state);

describe("canonicalJson", () => {
  it("stringifies with a 2-space indentation", () => {
    expect(canonicalJson({ enabled: true })).toBe('{\n  "enabled": true\n}');
  });

  it("indents nested structures", () => {
    expect(canonicalJson({ params: { a: 1 } })).toBe('{\n  "params": {\n    "a": 1\n  }\n}');
  });

  it("handles primitives", () => {
    expect(canonicalJson(42)).toBe("42");
    expect(canonicalJson("text")).toBe('"text"');
    expect(canonicalJson(null)).toBe("null");
  });

  it("returns undefined for values JSON cannot serialize", () => {
    expect(canonicalJson(undefined)).toBeUndefined();
  });

  it("produces output that round-trips through both diff sides identically", () => {
    const value = { enabled: true, params: { ratio: 0.5 } };
    expect(canonicalJson(value)).toBe(canonicalJson(value));
  });
});

describe("diffJsonLines", () => {
  it("marks every line as unchanged when both sides are identical", () => {
    const json = canonicalJson({ enabled: true, params: { a: 1 } });
    const result = diffJsonLines(json, json);
    expect(states(result)).toEqual(Array(json.split("\n").length).fill("none"));
    expect(texts(result)).toEqual(json.split("\n"));
  });

  it("tags only-in-current lines as added", () => {
    const base = "a\nb";
    const current = "a\nx\nb";
    const result = diffJsonLines(base, current);
    expect(result).toEqual([
      { state: "none", text: "a" },
      { state: "added", text: "x" },
      { state: "none", text: "b" },
    ]);
  });

  it("tags only-in-base lines as removed", () => {
    const base = "a\nx\nb";
    const current = "a\nb";
    const result = diffJsonLines(base, current);
    expect(result).toEqual([
      { state: "none", text: "a" },
      { state: "removed", text: "x" },
      { state: "none", text: "b" },
    ]);
  });

  it("represents a modified line as a removal followed by an addition", () => {
    const result = diffJsonLines('  "enabled": false', '  "enabled": true');
    expect(result).toEqual([
      { state: "removed", text: '  "enabled": false' },
      { state: "added", text: '  "enabled": true' },
    ]);
  });

  it("preserves display order across mixed edits", () => {
    const result = diffJsonLines("a\nb\nc", "a\nB\nc\nd");
    expect(result).toEqual([
      { state: "none", text: "a" },
      { state: "removed", text: "b" },
      { state: "added", text: "B" },
      { state: "none", text: "c" },
      { state: "added", text: "d" },
    ]);
  });

  it("ignores trailing whitespace when comparing but keeps the original text", () => {
    const result = diffJsonLines("a  \nb", "a\nb\t");
    expect(states(result)).toEqual(["none", "none"]);
    expect(texts(result)).toEqual(["a  ", "b"]);
  });

  it("resyncs across the many identical lines JSON produces", () => {
    const base = canonicalJson({ enabled: false, params: { a: 1, b: 2 } });
    const current = canonicalJson({ enabled: true, params: { a: 1, b: 2 } });
    const result = diffJsonLines(base, current);

    expect(result.filter(l => l.state === "removed")).toEqual([
      { state: "removed", text: '  "enabled": false,' },
    ]);
    expect(result.filter(l => l.state === "added")).toEqual([
      { state: "added", text: '  "enabled": true,' },
    ]);
  });

  it("removes every base line against an empty current", () => {
    const result = diffJsonLines("a\nb", "");
    expect(result).toEqual([
      { state: "removed", text: "a" },
      { state: "removed", text: "b" },
      { state: "added", text: "" },
    ]);
  });

  it("adds every current line against an empty base", () => {
    const result = diffJsonLines("", "a\nb");
    expect(result).toEqual([
      { state: "removed", text: "" },
      { state: "added", text: "a" },
      { state: "added", text: "b" },
    ]);
  });

  it("returns a single unchanged empty line for two empty strings", () => {
    expect(diffJsonLines("", "")).toEqual([{ state: "none", text: "" }]);
  });

  it("produces a minimal edit script rather than rewriting unchanged lines", () => {
    const base = "line1\nline2\nline3\nline4";
    const current = "line1\nline3\nline4";
    const result = diffJsonLines(base, current);
    expect(result.filter(l => l.state !== "none")).toEqual([{ state: "removed", text: "line2" }]);
  });
});
