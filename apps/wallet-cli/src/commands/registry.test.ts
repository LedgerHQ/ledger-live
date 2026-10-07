import { describe, it, expect } from "bun:test";
import { readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { COMMANDS, commandDescription, loadCommands, type CommandEntry } from "./registry";

describe("COMMANDS", () => {
  it("is sorted by name", () => {
    const names = COMMANDS.map(entry => entry.name);
    expect(names).toEqual([...names].sort());
  });

  it("includes every top-level command module", async () => {
    const modules = readdirSync(import.meta.dir, { withFileTypes: true }).flatMap(dirent => {
      if (dirent.isDirectory()) {
        const index = path.join(import.meta.dir, dirent.name, "index.ts");
        return existsSync(index) ? [index] : [];
      }
      const isSource = dirent.name.endsWith(".ts") && !dirent.name.endsWith(".test.ts");
      return isSource && dirent.name !== "registry.ts"
        ? [path.join(import.meta.dir, dirent.name)]
        : [];
    });
    const registered = new Set(COMMANDS.map(entry => entry.name));
    for (const file of modules) {
      const command = (await import(file)).default as { name?: unknown } | undefined;
      if (typeof command?.name === "string") expect(registered.has(command.name), file).toBe(true);
    }
  });

  it.each(COMMANDS.map(entry => [entry.name, entry]))(
    "%s matches its module's definition",
    async (_name, entry) => {
      const command = await entry.load();
      expect({
        name: command.name,
        description: command.description,
        subcommands: (command.commands ?? []).map(subcommand => subcommand.name),
      }).toEqual({
        name: entry.name,
        description: entry.description,
        subcommands: [...entry.subcommands],
      });
    },
  );
});

describe("commandDescription", () => {
  it("returns the registered description", () => {
    expect(commandDescription("session")).toBe("Session management commands");
  });

  it("throws for a command missing from the registry", () => {
    expect(() => commandDescription("nope")).toThrow('"nope" is not in the command registry');
  });
});

function fakeEntries(): { entries: CommandEntry[]; loaded: string[] } {
  const loaded: string[] = [];
  const entries = ["session", "skill", "swap"].map(name => ({
    name,
    description: `${name} commands`,
    subcommands: [],
    load: async () => {
      loaded.push(name);
      return { name, description: `${name} commands`, handler: async () => {} };
    },
  }));
  return { entries, loaded };
}

describe("loadCommands", () => {
  it("loads only the invoked command", async () => {
    const { entries, loaded } = fakeEntries();
    const commands = await loadCommands(["skill", "list"], entries);
    expect(loaded).toEqual(["skill"]);
    expect(commands.map(command => command.name)).toEqual(["session", "skill", "swap"]);
    expect(commands[0]).toEqual({
      name: "session",
      description: "session commands",
      commands: [],
    });
  });

  it("loads nothing for root help or version", async () => {
    for (const argv of [[], ["--help"], ["--version"]]) {
      const { entries, loaded } = fakeEntries();
      await loadCommands(argv, entries);
      expect(loaded, argv.join(" ")).toEqual([]);
    }
  });

  it("finds the command after global flags", async () => {
    const { entries, loaded } = fakeEntries();
    await loadCommands(["--format", "json", "swap", "--help"], entries);
    expect(loaded).toEqual(["swap"]);
  });

  it("ignores words after --", async () => {
    const { entries, loaded } = fakeEntries();
    await loadCommands(["session", "view", "--", "swap"], entries);
    expect(loaded).toEqual(["session"]);
  });

  it.each([["--llms"], ["--llms-full"], ["--llms=true"]])(
    "loads every command for %s",
    async flag => {
      const { entries, loaded } = fakeEntries();
      await loadCommands([flag], entries);
      expect(loaded).toEqual(["session", "skill", "swap"]);
    },
  );
});
