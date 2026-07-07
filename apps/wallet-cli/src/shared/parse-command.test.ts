import { describe, expect, it } from "bun:test";
import { parseCommand } from "./parse-command";

describe("parseCommand", () => {
  it("returns a top-level command", () => {
    expect(parseCommand(["balances"])).toBe("balances");
  });

  it("ignores positional arguments after a top-level command", () => {
    expect(parseCommand(["balances", "eth-1"])).toBe("balances");
  });

  it("ignores flags after a top-level command", () => {
    expect(parseCommand(["balances", "--output", "json"])).toBe("balances");
  });

  it("resolves a group command with its subcommand", () => {
    expect(parseCommand(["swap", "execute"])).toBe("swap execute");
  });

  it("resolves a group subcommand followed by flags", () => {
    expect(parseCommand(["swap", "execute", "--from", "eth"])).toBe("swap execute");
  });

  it("resolves nested subcommands with a value between the words", () => {
    expect(parseCommand(["account", "discover", "ethereum"])).toBe("account discover");
  });

  it("returns just the group when no subcommand is given", () => {
    expect(parseCommand(["swap"])).toBe("swap");
  });

  it("returns just the group when a flag follows it", () => {
    expect(parseCommand(["swap", "--help"])).toBe("swap");
  });

  it("returns just the group when the subcommand is unknown", () => {
    expect(parseCommand(["swap", "bogus"])).toBe("swap");
  });

  it("returns undefined for an unknown command", () => {
    expect(parseCommand(["nope"])).toBeUndefined();
  });

  it("returns undefined for empty argv", () => {
    expect(parseCommand([])).toBeUndefined();
  });

  it("returns undefined when argv starts with a flag", () => {
    expect(parseCommand(["--help"])).toBeUndefined();
  });
});
