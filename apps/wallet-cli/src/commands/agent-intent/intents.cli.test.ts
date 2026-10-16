import { afterAll, describe, expect, it } from "bun:test";
import { runCli } from "../../testing/cli-runner";
import { makeSessionDir } from "../../testing/session-fixture";

// Through the real flag parsing: a schema on --page-size would refuse "7" before the handler runs.
describe("agent-intent intents (CLI)", () => {
  const fixture = makeSessionDir([]);
  afterAll(() => fixture.cleanup());

  it.each([
    ["--status", "signed"],
    ["--page-size", "50"],
    ["--page-size", "7"],
  ])("refuses --cursor with %s %s", async (flag, value) => {
    const { stdout, exitCode } = await runCli(
      [
        "agent-intent",
        "intents",
        "--profile",
        "bot",
        "--cursor",
        "abc",
        flag,
        value,
        "--output",
        "json",
      ],
      fixture.env,
    );

    expect(exitCode).toBe(1);
    expect(JSON.parse(stdout).error.message).toBe(
      "--cursor continues with the filters and page size of the listing that returned it: drop " +
        "--status and --page-size.",
    );
  });
});
