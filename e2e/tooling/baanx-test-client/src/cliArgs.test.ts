import { parseCliArgs } from "./cliArgs";

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
});
