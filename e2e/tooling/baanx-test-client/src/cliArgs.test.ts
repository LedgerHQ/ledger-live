import { flagNameOf, parseCliArgs } from "./cliArgs";

/**
 * `pnpm run <script> -- --json` forwards the `--` separator into argv, so the
 * documented CLI invocation must not treat it as an argument.
 */
describe("parseCliArgs", () => {
  it("runs with no arguments", () => {
    expect(parseCliArgs([])).toEqual({ kind: "run", format: "token" });
  });

  it("recognises --json", () => {
    expect(parseCliArgs(["--json"])).toEqual({ kind: "run", format: "json" });
  });

  it("recognises --session", () => {
    expect(parseCliArgs(["--session"])).toEqual({ kind: "run", format: "session" });
  });

  it("prefers --session when both are given, as the more specific request", () => {
    expect(parseCliArgs(["--json", "--session"])).toEqual({ kind: "run", format: "session" });
  });

  it.each([
    [["--"], { kind: "run", format: "token" }],
    [["--", "--json"], { kind: "run", format: "json" }],
    [["--", "--session"], { kind: "run", format: "session" }],
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

  it.each(["--nope", "-j"])("leaves the valueless flag %p intact", argument => {
    expect(flagNameOf(argument)).toBe(argument);
  });

  it.each(["hunter2", "extra", "some-token-value"])(
    "never echoes the positional argument %p, which could itself be the secret",
    argument => {
      const reported = flagNameOf(argument);
      expect(reported).not.toContain(argument);
      expect(reported).toBe("[redacted positional argument]");
    },
  );

  it("never returns the secret half", () => {
    expect(flagNameOf("--password=hunter2")).not.toContain("hunter2");
  });
});
