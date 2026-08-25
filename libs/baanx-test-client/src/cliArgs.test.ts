import { flagNameOf, parseCliArgs } from "./cliArgs";

/**
 * `pnpm run <script> -- --json` forwards the `--` separator into argv, so the
 * documented CLI invocation must not treat it as an argument.
 */
describe("parseCliArgs", () => {
  it("runs with no arguments", () => {
    expect(parseCliArgs([])).toEqual({ kind: "run", asJson: false });
  });

  it("recognises --json", () => {
    expect(parseCliArgs(["--json"])).toEqual({ kind: "run", asJson: true });
  });

  it.each([
    [["--"], { kind: "run", asJson: false }],
    [["--", "--json"], { kind: "run", asJson: true }],
    [["--", "--help"], { kind: "help" }],
  ])("drops the pnpm -- separator in %j", (argv, expected) => {
    expect(parseCliArgs(argv as string[])).toEqual(expected);
  });

  it.each([["--help"], ["-h"]])("treats %s as help", flag => {
    expect(parseCliArgs([flag])).toEqual({ kind: "help" });
  });

  it("prefers help over an unknown argument", () => {
    expect(parseCliArgs(["--nope", "--help"])).toEqual({ kind: "help" });
  });

  it.each([["--secret=abc"], ["--password"], ["-j"], ["extra"]])("rejects %s", argument => {
    expect(parseCliArgs([argument])).toEqual({ kind: "unknown", argument });
  });

  it("reports the first unknown argument", () => {
    expect(parseCliArgs(["--json", "--first", "--second"])).toEqual({
      kind: "unknown",
      argument: "--first",
    });
  });
});

describe("flagNameOf", () => {
  it.each([
    ["--password=hunter2", "--password=[redacted]"],
    ["--client-key=abc123", "--client-key=[redacted]"],
    ["--secret=a=b=c", "--secret=[redacted]"],
  ])("redacts the value in %p", (input, expected) => {
    expect(flagNameOf(input)).toBe(expected);
  });

  it.each(["--nope", "-j", "extra"])("leaves the valueless argument %p intact", argument => {
    expect(flagNameOf(argument)).toBe(argument);
  });

  it("never returns the secret half", () => {
    expect(flagNameOf("--password=hunter2")).not.toContain("hunter2");
  });
});
